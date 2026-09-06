# HERO RUSH — Claude Code 프로젝트 브리프 (MVP v0.1)

> 이 파일은 Claude Code에게 주는 단일 작업 지시서다. 프로젝트 루트에 `CLAUDE.md`로 복사해서 시작하라.
> 원작: Magic Rush: Heroes (Elex/Moonton, 2015). **메커니즘만 재현**한다. 원작의 영웅 이름·아트·텍스트·로고는 절대 사용하지 않는다(IP). 모든 캐릭터·명칭은 이 문서의 오리지널 설정을 쓴다.

---

## 0. 결정 사항 (변경 금지, 바꾸려면 사용자에게 먼저 물을 것)

| 항목 | 결정 | 이유 |
|---|---|---|
| 엔진 | **Phaser 3 + TypeScript + Vite** | 순수 코드라 Claude Code 반복·헤드리스 테스트가 가장 빠름. 사용자는 모바일에서 원격 조작하므로 GitHub Pages URL로 폰에서 즉시 테스트 가능 |
| 1차 플랫폼 | **웹(PWA)** → GitHub Pages | Android APK는 MVP 이후 Capacitor로 래핑 |
| 화면 | **가로 16:9, 기준 해상도 1920×1080**, Scale.FIT | 원작이 가로 |
| MVP 범위 | **캠페인 전투 코어만**: 5인 파티 · 스킬 에이밍 · 웨이브 · 스테이지 10개 | 육성/가챠/타워디펜스/PvP는 v0.2 이후 |
| 아트 | **AI 생성 키아트 1장 + 절차적 애니메이션** | 스프라이트 시트를 AI로 프레임별 일관되게 뽑는 건 불가. 정지 키아트를 코드로 움직인다(§6) |
| 저장 | localStorage (진행도만) | 서버 없음 |
| 저장소 | GitHub `silverylaker-cmyk/hero-rush` (public) | 배포는 `gh-pages` 브랜치, GitHub Actions |

---

## 1. 목표 한 줄

"5명의 영웅이 자동으로 오른쪽으로 진격하며 싸우고, 플레이어는 궁극기가 차면 **직접 조준해서** 쏘는 가로 스크롤 실시간 전투" — 이게 전부다. 이것이 60fps로 폰에서 재미있게 돌아가면 MVP 완료.

---

## 2. 기술 스택 & 저장소 구조

```
hero-rush/
├── CLAUDE.md                 ← 이 파일
├── package.json              (phaser@^3.80, typescript, vite, vitest, playwright)
├── vite.config.ts            (base: '/hero-rush/')
├── .github/workflows/deploy.yml   (push main → build → gh-pages)
├── public/
│   ├── manifest.webmanifest, icons/
│   └── assets/               (이미지·오디오, §6 명명 규칙)
├── src/
│   ├── core/                 ★ 순수 TS, Phaser import 금지. 여기가 게임 로직 전부.
│   │   ├── types.ts          (Unit, Stats, Skill, StatusEffect, StageDef …)
│   │   ├── rng.ts            (seeded RNG — mulberry32)
│   │   ├── sim.ts            (BattleSim: fixed-step 60Hz tick, 입력 큐)
│   │   ├── systems/          (movement, targeting, combat, energy, status, skill, wave)
│   │   └── data/             (heroes.json, enemies.json, skills.json, stages.json 로더)
│   ├── render/               Phaser 전용. core 상태를 읽어서 그리기만 한다.
│   │   ├── scenes/ Boot, Preload, StageSelect, Battle, Result
│   │   ├── UnitView.ts       (키아트 + 절차 애니메이션)
│   │   ├── AimOverlay.ts     (스킬 에이밍 UI)
│   │   ├── Hud.ts            (궁극기 버튼 5개, 웨이브 표시, 배속/오토)
│   │   └── vfx/              (파티클·도형 기반 이펙트)
│   ├── data/*.json
│   └── main.ts
├── tests/
│   ├── core/*.test.ts        (vitest — 시뮬레이션 단위 테스트)
│   └── e2e/smoke.spec.ts     (playwright — 페이지 로드·스테이지 1 클리어)
└── tools/
    ├── gen-prompts.md        (AI 아트 프롬프트 템플릿, §6)
    └── rembg.py              (배경 제거 후처리)
```

**핵심 규칙: `src/core`는 렌더러 없이 Node에서 실행 가능해야 한다.** `BattleSim.runHeadless(stageId, seed, policy)`로 스테이지 하나를 끝까지 돌려 승패·소요 tick을 반환할 수 있어야 하며, 이걸로 밸런스 테스트를 자동화한다.

---

## 3. 전투 규칙 (정량 스펙)

### 3.1 필드
- 월드 폭 5760px(= 화면 3장), 높이 1080. 지면 y 기준선 y=820. 카메라는 파티 중심 x를 따라 오른쪽으로만 이동(뒤로 안 감).
- 좌표는 1D 진행축 x + 소폭 y 오프셋(전열/중열/후열 시각 분리용). 충돌은 x축 거리로만 판정.

### 3.2 유닛 공통 스탯
```ts
interface Stats {
  hp: number; atk: number; def: number; mres: number;
  atkSpeed: number;   // 초당 기본공격 횟수 (0.6~1.4)
  range: number;      // px. 근접 120, 원거리 520
  moveSpeed: number;  // px/s. 기본 180
  energyOnHit: number;    // 기본공격 1회당 에너지 (기본 12)
  energyOnDamaged: number;// 피격 1회당 (기본 8)
}
```
- 데미지 공식: `dmg = max(1, atk * atk / (atk + def))` (물리) / `mres` 사용(마법). 크리티컬 없음(MVP).
- 회복은 `mres` 무시.

### 3.3 진영·대형
- 아군 5명: `slot` 0~4. 대형 위치(x 오프셋, y 오프셋):
  - 전열(front): x -0, y +0 / 중열(mid): x -140, y +40 / 후열(back): x -280, y -40 (후열 2명은 y ±60 분리)
- 적은 웨이브마다 지정 x에 스폰(화면 오른쪽 밖 +200).
- 이동: 사거리 내 타겟 없으면 아군은 +x, 적은 -x로 전진. 앞 유닛과 60px 이하면 정지(밀치기 없음).

### 3.4 타겟팅
- 기본: 사거리 내 가장 가까운 적. 없으면 전진.
- 타겟 사망 시 즉시 재타겟.
- `targetPolicy` 옵션: `nearest` | `backline`(가장 먼 적 우선) | `lowestHp`.

### 3.5 에너지 & 궁극기
- 에너지 0~100. 획득: 기본공격 성공 +12, 피격 +8, 초당 +2(수동 회복), 아군 사망 시 생존자 전원 +15.
- 100 도달 → HUD 버튼 점등 + 초상 테두리 펄스. 사용 시 0으로.
- **오토 모드**: 100 되면 즉시 자동 시전(타겟은 policy 기본값). MVP 기본값은 수동.

### 3.6 스킬 에이밍 (이 게임의 정체성 — 가장 정성 들일 것)
버튼 **누르고 있는 동안** 조준, **떼면** 시전. 조준 중 게임 속도 **0.25×**(정지 아님 — 원작 느낌). 버튼 밖 아래로 드래그 후 떼면 취소.

| aimType | 조작 | 표시 | 예 |
|---|---|---|---|
| `none` | 탭 | 없음 | 전체 힐, 버프 |
| `target_enemy` | 드래그 → 적 위에서 놓기 | 적마다 히트박스, 선택 시 하이라이트 링 | 단일 강타 |
| `target_ally` | 드래그 → 아군 위 | 동일 | 단일 힐/보호막 |
| `ground_point` | 드래그 → 지면 좌표 | 반경 원(반투명), 유효범위 밖이면 빨강 | 원형 AoE |
| `direction` | 드래그 벡터 | 시전자 기준 각도 제한(±30°) 직선 빔, 폭 표시 | 관통 화살, 돌진 |

- 조준 중 손가락 위치는 월드 좌표로 변환(카메라 오프셋 반영). 폰 엄지 조작 고려: 유닛 히트박스는 실제 스프라이트보다 1.4× 크게.
- 시전 성공 시 카메라 살짝 흔들림(4px, 120ms) + 화면 플래시 5% 알파.

### 3.7 상태이상 (StatusEffect)
| 종류 | 효과 | 해제 |
|---|---|---|
| stun | 이동·공격·시전 불가 | 지속시간 |
| silence | 궁극기 시전 불가, 적은 캐스팅 캔슬 | 지속시간 |
| airborne | stun + 위로 튐(시각) | 0.8s 고정 |
| knockback | +x(적 기준) 200px 밀림, 0.3s stun | 즉시 |
| dot | 초당 데미지 tick | 지속시간 |
| shield | 흡수 HP 풀 | 소진/시간 |
| atk_up / def_down | 비율 버프/디버프 | 지속시간 |

- 같은 종류 중첩 시 지속시간 갱신(더 긴 쪽). 보스는 stun/airborne 지속 50%.

### 3.8 적 캐스팅 & 인터럽트
- 캐스터형 적(샤먼·보스)은 스킬 전 **캐스팅 바**(머리 위, 1.5~3s)를 띄운다. 이 동안 stun/silence/airborne/knockback을 맞으면 **캐스팅 취소**(원작의 핵심 재미). 취소 시 "INTERRUPT!" 텍스트 팝.

### 3.9 웨이브 & 스테이지
- 스테이지 = 웨이브 2~3개. 웨이브 클리어 → 파티 3초 전진 → 다음 웨이브 스폰. 마지막 웨이브는 보스 포함.
- 승리: 마지막 웨이브 전멸. 패배: 아군 5명 전멸.
- 별점: 생존 5명 ★3 / 3~4명 ★2 / 1~2명 ★1.
- 전투 중 **2× 배속** 토글, 일시정지/포기 버튼.

---

## 4. 콘텐츠 데이터 (JSON 스키마 + 초기값)

### 4.1 heroes.json
```ts
interface HeroDef {
  id: string; name: string; role: 'tank'|'melee'|'ranged'|'mage'|'healer';
  row: 'front'|'mid'|'back'; stats: Stats; skillId: string;
  art: { key: string; portrait: string; scale: number; anchorY: number };
}
```
초기 6명 (오리지널 — 원작 이름 금지):

| id | 이름 | 역할/열 | HP/ATK/DEF/MRES | 사거리 | 궁극기 (skillId) |
|---|---|---|---|---|---|
| ironwall | 강철 방패 브람 | tank/front | 2400/110/180/120 | 120 | `quake_slam`: ground_point r=220, 물리 320 + stun 1.5s |
| lancer | 창기병 세라 | melee/front | 1600/190/120/80 | 140 | `charge_lance`: direction, 경로상 적 물리 380 + knockback |
| shade | 그림자 검 카이 | melee/mid | 1300/240/90/70 | 120 | `phantom_strike`: target_enemy, 물리 620 + airborne, 기본 policy=backline |
| ember | 화염술사 리안 | mage/back | 1000/230/60/140 | 520 | `flame_storm`: ground_point r=260, 마법 180 즉시 + dot 60/s 4s |
| hawkeye | 사냥꾼 노아 | ranged/back | 1100/210/70/80 | 560 | `piercing_shot`: direction 폭 80, 관통 물리 450 + silence 2s |
| lumen | 성가수 미엘 | healer/back | 1200/120/80/150 | 480 | `sanctuary`: target_ally, 힐 700 + shield 400 6s |

- 기본공격: 근접은 즉시 판정, 원거리/마법은 투사체(속도 900px/s, 유도).
- 기본 파티 = 위 5명(shade 제외). 스테이지 선택 화면에서 6명 중 5명 편성 가능(드래그 없이 탭 토글).

### 4.2 enemies.json
| id | 이름 | 타입 | HP/ATK/DEF/MRES | 특성 |
|---|---|---|---|---|
| grunt | 고블린 병사 | melee | 600/90/40/30 | 기본 |
| slinger | 고블린 투석병 | ranged | 450/110/20/20 | 사거리 480 |
| shaman | 늪 주술사 | caster | 700/80/40/90 | 2.5s 캐스팅 → 아군 전체 마법 150 + def_down 20% 5s. 인터럽트 대상 |
| brute | 오우거 | boss/melee | 4500/220/120/60 | 3s 캐스팅 → 전방 부채꼴 물리 400 + knockback. CC 지속 50% |

### 4.3 stages.json
```ts
interface StageDef { id: number; name: string; waves: { spawns: {enemyId: string; count: number; levelScale: number}[] }[]; }
```
챕터 1, 스테이지 1~10. `levelScale`은 스탯 승수: 1-1 = 1.0 → 1-10 = 2.2 (선형). 구성 예:
- 1-1: [grunt×3] [grunt×4]
- 1-3: [grunt×3, slinger×2] [grunt×4, slinger×2]
- 1-5: [grunt×4, slinger×2] [shaman×1, grunt×3] [brute×1, grunt×2]
- 1-10: [grunt×5, slinger×3] [shaman×2, grunt×4, slinger×2] [brute×2, shaman×1]
- 나머지는 이 사이를 보간. **헤드리스 시뮬로 오토 정책 기준 1-1~1-3은 100% 승리, 1-8 이상은 수동 조준 없이는 50% 이하 승률**이 되도록 `levelScale`을 튜닝하라(§8 테스트).

---

## 5. 화면 흐름
```
Boot → Preload(진행바) → StageSelect ─▶ Battle ─▶ Result(★, 재도전/다음/목록)
                              ▲                          │
                              └──────────────────────────┘
```
- StageSelect: 가로 스크롤 맵 없이 10개 노드 카드 + 파티 편성 바(6명 중 5명). 잠금은 이전 스테이지 클리어 기준. localStorage 키 `hr.progress.v1`.
- Battle HUD 배치(1920×1080 기준): 하단 중앙 궁극기 버튼 5개(각 160×160, 간격 24) — 엄지 도달 범위. 좌상단 웨이브 `1/3`, 우상단 배속·일시정지. 유닛 머리 위 HP바(폭 90, 높이 8) + 에너지바(높이 4, 노랑).
- 세로로 잡으면 "가로로 돌려주세요" 오버레이. `screen.orientation.lock('landscape')` 시도(PWA 설치 시 동작).

---

## 6. 아트 파이프라인 (AI 생성)

### 6.1 원칙
- 캐릭터당 **키아트 PNG 1장**(투명 배경, 측면 3/4 뷰, 오른쪽을 바라봄, 1024×1024 안에 전신). 적도 동일하되 **왼쪽을 바라봄**(코드에서 flipX 하지 말 것 — 광원 뒤집힘 방지).
- 애니메이션은 코드로: 
  - idle: y 사인 바운스 ±4px 1.2s
  - walk: y 바운스 ±6px 0.35s + 8° 좌우 롤
  - attack(근접): 0.12s 전방 60px 러쉬 → 0.2s 복귀, scaleX 1.15 스쿼시
  - attack(원거리): 0.1s 뒤로 15px 반동 + 투사체 스폰
  - cast: 0.5s 위로 20px 들림 + 흰 아우라 파티클
  - hit: 60ms 흰색 틴트 + x 흔들림 6px
  - death: 0.5s 알파 0 + 회전 -25° + y +40
- 초상(portrait) 256×256은 키아트에서 얼굴 크롭(코드/스크립트로 자동).
- 배경: 3레이어 패럴랙스(하늘 0.1×, 원경 0.4×, 지면 1.0×) 각 3840×1080 타일링 가능 PNG 1세트(챕터 1 "고블린 늪지").
- VFX는 Phaser 파티클 + Graphics로. 이미지 VFX는 MVP 없음.

### 6.2 스타일 락 (모든 프롬프트 공통 접두)
```
stylized fantasy mobile-game character, clean bold lineart, cel shading with soft gradients,
2.5–3 head proportion, chunky readable silhouette, saturated palette, single top-left key light,
full body, three-quarter side view facing RIGHT, feet on invisible floor, centered,
plain solid #00FF00 background, no text, no watermark, no frame
```
(적: `facing LEFT`, 팔레트에 `desaturated murky green-purple` 추가.)

### 6.3 캐릭터별 디스크립터 (`tools/gen-prompts.md`에 옮겨 적을 것)
- ironwall: heavy plate armor, tower shield, war hammer, bearded stoic man
- lancer: light silver lance, blue scarf, athletic woman, ponytail
- shade: hooded assassin, twin curved daggers, purple shadow wisps, young man
- ember: red-orange robe, floating flame orbs, staff with ruby, young woman
- hawkeye: leather ranger, longbow, green cloak, sharp eyes, young man
- lumen: white-gold priestess robe, glowing halo ring, harp, gentle expression
- grunt: goblin soldier, rusty sword, wooden shield / slinger: goblin with sling and pouch / shaman: swamp shaman, bone staff, skull mask / brute: giant ogre, spiked club, scars

### 6.4 생성·후처리 절차
1. 사용자가 Codex CLI(gpt-image) 또는 Higgsfield로 생성 → `raw/` 에 저장. **Claude Code는 이미지를 생성하지 않는다. 프롬프트 파일만 준비하고, 이미지가 없을 땐 §6.5 플레이스홀더로 진행.**
2. `tools/rembg.py`: 크로마키(#00FF00) 제거 → 실패 시 `rembg` 패키지 폴백 → 트림 → 1024 캔버스 → `public/assets/units/{id}.png`
3. 초상 크롭 → `public/assets/portraits/{id}.png`

### 6.5 플레이스홀더 (M0~M3에서 사용)
- 아군: 파란 계열 둥근 사각형 + 역할 이니셜(T/L/S/M/R/H), 적: 빨간 계열. 크기 role별(탱커 160, 보스 260). **UnitView는 텍스처 키가 없으면 자동으로 플레이스홀더를 그린다** — 아트 교체가 JSON 한 줄 수정으로 끝나야 함.

---

## 7. 사운드
- 무료 SFX(Kenney, freesound CC0)로 6종: 근접 히트, 원거리 발사, 궁극기 시전, 인터럽트, 승리, 패배. BGM은 MVP 없음. 오디오는 첫 터치 후 unlock.

---

## 8. 테스트 & 품질 기준

### 8.1 vitest (`tests/core`)
- 데미지 공식, 에너지 누적/소모, 상태이상 중첩 규칙, 인터럽트(캐스팅 중 stun → 취소), 웨이브 전환, 승패 판정.
- **밸런스 시뮬**: 시드 20개 × 스테이지 10개 × 정책(auto / noUlt) → 승률 표를 `tests/balance-report.md`에 출력. 목표: §4.3 기준.
- 결정성: 같은 시드+같은 입력 큐 → 동일 결과 (스냅샷 테스트).

### 8.2 playwright (`tests/e2e`)
- 페이지 로드 → 스테이지 1 진입 → 오토 켜고 → 60s 내 Result 씬 도달.

### 8.3 성능
- 갤럭시 중급기 기준 60fps. 유닛 최대 동시 20. 텍스처 아틀라스 1장(2048²)로 유닛 전부. Chrome devtools 6× CPU 스로틀에서 30fps 이상.

### 8.4 완료 정의(DoD) — 각 마일스톤 커밋 전
`npm run typecheck && npm run test && npm run build` 전부 통과. 커밋 메시지는 `M{n}: …`.

---

## 9. 마일스톤 (순서대로, 하나 끝나고 다음)

| M | 내용 | 완료 기준 |
|---|---|---|
| **M0** | Vite+Phaser+TS 스캐폴드, GitHub Actions → Pages 배포, PWA manifest, 가로 강제 오버레이 | URL 열면 검은 화면에 "HERO RUSH" 텍스트, 폰에서 설치 가능 |
| **M1** | `src/core` 전체: 시뮬 · 6영웅/4적 데이터 · 스킬 5종 aimType 로직 · 상태이상 · 인터럽트 · 웨이브 · 헤드리스 러너 | vitest 전부 통과, `npm run sim -- --stage 5 --seed 1` 로 승패 출력 |
| **M2** | Battle 씬 렌더: 플레이스홀더 유닛, 카메라, HP/에너지바, 궁극기 HUD, **스킬 에이밍 오버레이 5종**, 슬로모, VFX 기본 | 폰에서 1-1 수동 조준으로 클리어 가능 |
| **M3** | StageSelect · Result · 별점 · 진행 저장 · 파티 편성 · 2배속/오토 · 스테이지 1~10 밸런스 튜닝 | 밸런스 리포트 목표 충족, e2e 통과 |
| **M4** | 아트 스왑: `tools/gen-prompts.md` 완성 → 사용자가 이미지 제공 → rembg → 아틀라스 → 절차 애니메이션 → 패럴랙스 배경 → SFX | 플레이스홀더 0개 |
| **M5** | 폴리싱: 터치 히트박스 튜닝, 성능, 튜토리얼 툴팁(첫 궁극기 시 "드래그해서 조준"), Capacitor Android 빌드 스크립트(선택) | 사용자 플레이 테스트 OK |

---

## 10. Claude Code 작업 규칙
1. 마일스톤 시작 전 이 문서의 해당 §를 다시 읽고, 끝나면 `CLAUDE.md` 하단 "진행 상황" 섹션을 갱신한다.
2. **MVP 범위 밖 기능(가챠·레벨업·장비·룬·타워디펜스·PvP)은 구현하지 않는다.** 확장 여지를 위해 `HeroDef.stats`를 함수가 아닌 데이터로 유지하는 정도만 허용.
3. `src/core`에 Phaser import가 생기면 실패. ESLint `no-restricted-imports`로 강제.
4. 모호한 건 추측하지 말고 **한 번에 모아서** 질문한다. 사용자는 폰에서 보므로 질문은 짧게, 선택지형으로.
5. 매 마일스톤 끝에 main에 push → Pages URL을 사용자에게 알린다(폰 테스트용).
6. 원작 고유명사·아트 검색/복제 금지. 참고가 필요하면 "메커니즘 설명"만 검색.

## 11. v0.2 이후 (참고만, 지금 하지 말 것)
영웅 레벨·별 승급 → 장비 4슬롯·룬 → 소환(가챠) → 타워디펜스 모드(경로 노드에 영웅 배치, 동일 스킬 에이밍 재사용) → 엘리트 캠페인 → Capacitor APK → (서버 필요) 아레나.

---
## 진행 상황
- [x] M0  - [x] M1  - [ ] M2  - [ ] M3  - [ ] M4  - [ ] M5

### M0 — 2026-09-06
- 독립 Phaser 3 + TypeScript + Vite 프로젝트, PWA, FIT 가로 화면, gh-pages 배포 워크플로.
- typecheck / test (스캐폴드, 테스트 0건) / build PASS.
- 기존 Godot 프로젝트는 읽기만 하며 수정하지 않는다.

### M1 — 2026-09-06
- 순수 TypeScript 60Hz 시뮬, 6영웅/4적/10스테이지 JSON, 5종 조준, 상태이상, 인터럽트, 투사체, 웨이브와 입력 타임라인.
- 24개 전투 테스트, 결정성·입력 재생·렌더 배치 크기 불변, typecheck/lint/build PASS.
- sim --stage 5 --seed 1 실행 확인. 초기 밸런스 게이트 PASS, 후반 수동 정책 난이도는 M3에서 정교화.
