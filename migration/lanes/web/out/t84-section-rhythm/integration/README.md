# T84 integrated verification

Baseline: origin/main ba5712a. After: T84 merged with the same main. Only the four T84 implementation files differ. No content patch or production write.

- `compare-before-*-full.png` and `compare-after-*-full.png`: full pages at 390 and 1440.
- `compare-before-*-group-0.png` and `compare-after-*-group-0.png`: intro plus related Features or Tabs for home, Pipedrive and Atlas.
- `../feature-normalization/compare-*.png`: refreshed section screenshots for home service rows and the about article.
- `*-outline.tsv`: tag and text from the HTTP response, before scripts; includes inactive panels. `after-summary.json` asserts no skipped levels on all four routes.
- `*-<width>.json`: measured section gaps, group membership and overflow. `gaps.md` compares both states.
- `before-probes.tsv`, `after-probes.tsv`, doctor/up logs: Worker health and HTTP evidence. `recapture-after.log` and `before-session.log` record final clean captures and cleanup.
- `diff-main.csv`: no SEO differences across the two 110-URL crawls. `anchors.txt` and `jsonld.txt`: unchanged anchors and JSON-LD.
- Remaining logs record the CI-equivalent checks and 22 passing Playwright tests. Python tests and e2e use local fixtures/mocks.

`capture.mjs after` records group membership and screenshots. `capture.mjs before` uses those same section indices against main. Both expect a healthy verify-web Worker at 127.0.0.1:8790. Feature captures use `../feature-normalization/capture.mjs`. Final screenshots reject optional consent locally and disable motion. Baseline sources must be restored after capture; do not mix a baseline dist with final source verification.
