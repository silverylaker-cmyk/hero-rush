# HERO RUSH v0.1 validation — 2026-09-06

Play: https://silverylaker-cmyk.github.io/hero-rush/

| Gate | Result |
|---|---|
| TypeScript check / core dependency lint / production build | PASS |
| Vitest: combat, aiming, status, interrupt, wave, determinism, storage, balance | 29 PASS |
| Chrome: stage 1 AUTO clear in 60s, stars saved, stage 2 unlocked | PASS |
| Chrome: held ground aim, quarter-speed ticks, release, cancel, pause/resume | PASS |
| Chrome: interrupt a real enemy casting bar through pointer input | PASS |
| Mobile viewport / portrait rotation guidance | PASS |
| Mobile touch events: direction aim and release | PASS |
| 20 initial units, 6× CPU throttling | 45.2 fps average; ≥30 PASS |
| Published build fingerprint matches local production build | PASS |
| Serviceworker installation → offline reload → stage 1 victory | PASS |

Balance: 20 seeds × 10 stages × auto/noUlt/tactical = 600 complete runs. Early AUTO 100%; late AUTO 10% / 35% / 0%. Late tactical comparison 95% / 55% / 40%. See `balance-report.md`. The tactical policy represents a reproducible comparison, not measured human skill.

Screenshots in `screenshots/` were viewed, including the casting interrupt, aim range, unit feet above the HUD, party selection and victory screen. `deployment-report.json` records the actual published JavaScript filename and serviceworker version. `performance-report.json` preserves the measured timing.

The first performance harness attempt left StageSelect active while starting Battle through the global scene manager; the harness timed out before measuring. It was corrected to stop StageSelect, then the 20-unit test passed. This was a harness setup error, not a reported frame-rate failure.

The provided art is an interim mapping into the new characters, with final design/facing differences documented in `public/assets/PROVENANCE.md`. The original Godot project and source art were only read. Every newly written game file is under the independent `hero-rush/` repository.

Still requires user/device review: actual midrange Galaxy 60fps, final character appearance, and user play-test acceptance (M5).
