# T33 hero badge responsive proof

Captured 2026-11-11 using Chromium and the local Worker on port 8790, started by verify-web `web.sh up`, checked with `doctor`, `probe`, and `shot`. Additional Playwright captures use that same Worker and live zawlodzki.pl. Shared preview automation was unavailable due to host AppArmor. Optional cookies declined for unobscured comparisons. No form submissions or external configuration writes.

Comparisons place **live left, local right**. Viewports are width × 1100; screenshots crop below the hero/photo and include the badge overlap. Responsive height caps depend on viewport height. Individual `*-live.png` and `*-local.png` are the original captures.

| Page | 1280 | 1024 | 768 | 375 |
|---|---|---|---|---|
| Sales Atlas (standard) | [1280](sales-atlas-system-1280-comparison.png) | [1024](sales-atlas-system-1024-comparison.png) | [768](sales-atlas-system-768-comparison.png) | [375](sales-atlas-system-375-comparison.png) |
| Salesforce (wide) | [1280](szkolenie-i-wdrozenie-salesforce-1280-comparison.png) | [1024](szkolenie-i-wdrozenie-salesforce-1024-comparison.png) | [768](szkolenie-i-wdrozenie-salesforce-768-comparison.png) | [375](szkolenie-i-wdrozenie-salesforce-375-comparison.png) |
| Homepage (no badge) | [1280](home-1280-comparison.png) | [1024](home-1024-comparison.png) | [768](home-768-comparison.png) | [375](home-375-comparison.png) |

## Findings

`measurements.json` records rendered photo, wrapper and badge rectangles, badge count, CTA text, and document scroll width. Photo and wrapper widths match at every size (461.77, 373.73, 440, 343px respectively). Both badged pages have scrollWidth 375 at viewport 375. Homepage has zero badge elements at all four widths; absolute badges reserve no space. Desktop badge sizes/offsets and CTA are unchanged.

Cause: MediaImage's image occupied the full-width box but `max-block-size: 40svh` plus `object-fit: contain` letterboxed the actual photo on single-column layouts. The relative wrapper stayed full width, so the badge appeared at its far-left corner. The 48rem container breakpoint controls the photo height cap independently of the 991px viewport badge breakpoint; this mismatch exposed the oversized anchor but did not remove relative positioning. The fix sizes the wrapper using the resolved image aspect ratio and the same height caps/container breakpoint as MediaImage. Negative offsets and isolation remain intentional.

Live retains its existing photo-first compact mobile hero, copy, navigation and spacing. Local retains the migration's text-first hero and larger mobile portrait. This task repairs the shared overlay anchor without redesigning those layouts. Standard remains 130/60px and wide 200/70px (desktop/mobile).

## Validation

- `astro-check.log`: 0 errors, 0 warnings, 1 existing hint.
- `build.log`: production build passes, 117 pages.
- `node-test-src.log`: literal `node --test src` fails MODULE_NOT_FOUND on Node 24.22.2 (directory treated as module).
- `node-tests-expanded.log`: explicit source test files: 81 pass, 1 skip, 0 fail.
- `design-detector.json`: no findings.
- `probes.tsv`: both badged routes return 200 and local noindex headers.
- Board check passes: 33 tasks, 0 problems.
