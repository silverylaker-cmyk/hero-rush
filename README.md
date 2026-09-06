# HERO RUSH

궁극기를 직접 조준하는 5인 파티 실시간 웹 게임. **기존 Hafgufa/Godot 게임과 독립된 새 프로젝트**입니다.

플레이: https://silverylaker-cmyk.github.io/hero-rush/

## 실행

```sh
npm ci
npm run dev
```

로컬 주소: http://localhost:5173/hero-rush/ — 같은 Wi-Fi의 휴대폰에서는 Vite가 출력하는 Network 주소를 사용합니다. 가로 화면 권장. 설치는 브라우저의 홈 화면 추가 메뉴를 사용하세요.

## 조작

- 6명 중 5명을 편성하고 전투 시작. 아군의 이동·기본 공격은 자동입니다.
- 에너지 100% 초상화를 **누른 채 드래그**, 원하는 적·아군·지점에서 **놓아서 궁극기 시전**. 조준 중 ¼ 배속. 화면 아래로 드래그하면 취소합니다.
- 적 머리 위 보라색 시전 바를 기절·침묵·띄우기·밀치기로 끊을 수 있습니다.
- AUTO로 궁극기 자동 사용, ×1/×2 배속, 일시정지, 소리 ON/OFF. Space도 일시정지입니다.
- 전원 생존 3별, 3~4명 2별, 1~2명 1별. 클리어하면 다음 스테이지가 열립니다.

## 검증

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run sim -- --stage 5 --seed 1 --policy auto
npm run balance
npm run test:e2e
```

E2E는 로컬 Chrome을 사용합니다. CI에서는 `npx playwright install --with-deps chromium` 후 실행합니다. `tests/balance-report.md`에 20시드 × 10스테이지 × auto/noUlt/tactical 비교가 있습니다. 화면 검수 스틸은 `tests/screenshots/`에 있습니다.

## 구조와 규칙

- `src/core/`: 렌더러에 의존하지 않는 순수 TypeScript 전투. 60Hz, mulberry32, 고정 입력 큐, 중앙 피해 파이프라인. ESLint로 Phaser/DOM/Math.random 사용을 차단합니다.
- `src/data/`: 6영웅, 4종 적, 스킬, 10스테이지 JSON.
- `src/render/`: Phaser 장면, 키아트 절차 애니메이션, 조준/카메라, UI, 파티클, 오리지널 합성 SFX 6종.
- `src/progress.ts`: `hr.progress.v1` 진행 저장, 스키마 검증, 별점 최대값 보존.
- `public/assets/`: 사용자 허용에 따라 기존 아트를 **복사**한 파일. 원본은 수정하지 않았습니다. 출처·새 캐릭터와의 외형 차이는 `PROVENANCE.md`에 명시했습니다.
- `.github/workflows/deploy.yml`: main → 검사/빌드 → gh-pages. GitHub Pages는 gh-pages의 `/`를 사용합니다.

## 구현에서 해석한 사항

- 에너지·피해 공식·영웅 기본 스탯은 브리프를 따릅니다. 전역 치명타·임의 피해 변동은 없습니다.
- 앞 유닛 뒤 60px에서 멈추는 규칙만 적용하면 넉백 이후 두 번째 근접 영웅이 영구 대기합니다. 앞 근접 영웅은 **공격 회복 중 접촉 거리 60px까지 좁혀** 뒤 영웅도 공격할 공간을 만듭니다. 피해 사거리 스탯은 변경하지 않습니다.
- 기본 편성의 후열은 3명이므로 y 오프셋을 −60/0/+60으로 분리했습니다.
- 방향 스킬의 피격 판정에는 유닛 몸통 반경 50px을 포함합니다. 조준 범위는 ±30°, 길이·폭은 스킬 JSON을 따릅니다.
- 1~3스테이지는 브리프 예시대로 일반 적으로 끝나며, 첫 보스는 5스테이지에 등장합니다.
- 비정상 장시간 전투는 180초에 timeout 패배로 종료합니다. 렌더 배속과 무관합니다.

## 아트와 모바일 검수 상태

재사용 키아트 10종·초상화 10종을 단일 2048² 아틀라스로 통합했습니다. 정면 캐릭터/무기/종족 등 브리프의 최종 디자인과 차이가 있어 원본 교체 프롬프트와 처리 도구를 `tools/`에 준비했습니다. 배경은 하늘·원경·지면의 3개 절차 생성 레이어입니다. 외부 게임의 이름·로고·아트는 사용하지 않았습니다.

데스크톱 Chrome의 실제 입력 테스트와 모바일 크기 화면 검수를 수행합니다. **실제 갤럭시 중급기의 60fps와 사용자 플레이 감각, 최종 아트 외형은 별도 기기/사용자 검수가 필요합니다.** 자동 테스트 결과를 그 검수의 대체로 표기하지 않습니다.

첫 로드 후 방문한 리소스를 서비스워커가 저장하여 오프라인 재실행을 지원합니다. 진행도는 해당 브라우저 localStorage에만 보관됩니다.

배포 경로와 좌표 변환 참고: [Vite 공식 배포 문서](https://vite.dev/guide/static-deploy), [Phaser 카메라 문서](https://docs.phaser.io/phaser/concepts/cameras).
