# T33 — badge-only proof

Final scope follows Grzesiek's correction: **preserve main/staging layout; fix only the badge**. Refreshed 2026-11-11 using Chromium, width × 1100 viewports. Optional cookies declined. Comparisons capture the hero plus lower badge overlap. Superseded photo-first evidence was replaced.

## Live badge reference vs local

Live left, local right. Live is the reference for visible lower-left overlap. Local intentionally retains main/staging's text-first layout rather than live's compact photo-first mobile layout.

| Badge | 1280 | 1024 | 768 | 375 |
|---|---|---|---|---|
| Standard | [1280](sales-atlas-system-1280-comparison.png) | [1024](sales-atlas-system-1024-comparison.png) | [768](sales-atlas-system-768-comparison.png) | [375](sales-atlas-system-375-comparison.png) |
| Wide | [1280](szkolenie-i-wdrozenie-salesforce-1280-comparison.png) | [1024](szkolenie-i-wdrozenie-salesforce-1024-comparison.png) | [768](szkolenie-i-wdrozenie-salesforce-768-comparison.png) | [375](szkolenie-i-wdrozenie-salesforce-375-comparison.png) |

## Staging layout controls vs local

Staging (`zawlodzki-web.zawlodzki.workers.dev`) left, local right. Both controls have no CMS badge.

| Control | 768 | 375 |
|---|---|---|
| Homepage | [768](home-768-comparison.png) | [375](home-375-comparison.png) |
| Sales audit | [768](audyt-sprzedazy-768-comparison.png) | [375](audyt-sprzedazy-375-comparison.png) |

Original captures are named `<route>-<width>-live.png`, `-staging.png`, or `-local.png`; the homepage uses `home`.

## Final implementation

The original wrapper stretched across the column while MediaImage height-capped the photo and object-fit contained it in that wider box. The cut-out also has transparent edges, so a badge placed outside the box appeared beside the visible torso.

Hero retains main's text-first source order, left-aligned copy/actions, 48px grid gap, existing portrait height caps and `@container (width >= 48rem)` columns. At 1280/1024 this produces columns; at 768/375 the original larger photo sits below the copy. There is no `order: -1`, compact mobile clamp, centered copy/actions, tightened gap, 992px media layout switch, or desktop portrait width cap.

Only badge-related behavior changes: the relative wrapper is centered and sized from image aspect ratio using MediaImage's existing 40svh / 32rem height caps. Badge widths are 34% (standard) / 52% (wide) of that rendered photo at every width. Inline inset 3% and block-end -8% place the badge over the lower-left visible torso instead of outside its transparent edge. Badges are absolute and remain conditional; no placeholder space is reserved.

## Evidence and checks

`measurements.json` records 24 captures across the 12 pairs, including visible image-content bounds as well as element boxes, copy/layout rectangles, badge ratios/counts, and document scroll width.

- Visually inspected badge overlap on both variants and the staging controls' restored text-first composition.
- Both controls' copy and visible-photo x/y/width/height match staging within 0.02px at 768/375. Grid columns, 48px gap, left text alignment and zero badge count also match. No empty gap was introduced.
- Photo widths at 1280/1024/768/375 are approximately 461.77/373.73/440/343px at the capture height. Wrapper widths match visible photo widths; badge/photo ratios are consistently 0.34 / 0.52. Height-dependent portrait caps retain main behavior.
- Both badged routes have document scrollWidth 375 at viewport 375.
- Local served by the real Worker on 8790 via verify-web `web.sh up`, `doctor`, `probe`, `shot`, then `down`. Shared preview automation was unavailable due to AppArmor; Playwright captured the same Worker.
- `probes.tsv`: four local routes return 200 with non-production noindex headers.
- `astro-check.log`: 0 errors/warnings, 1 existing hint. `build.log`: 117 pages built.
- `node-tests-expanded.log`: explicit source tests pass 81, skip 1, fail 0. Literal `node --test src` still fails MODULE_NOT_FOUND on Node 24.22.2; `node-test-src.log` records it.
- `design-detector.json`: no findings. Board check passes.
- Fetched main before work and again after PR #54 merged (main 4fad0b8); merge-tree reports no conflicts. No unrelated PR #54 changes were copied into this work.
- Verify-web stopped. No Sanity writes, deployment or PR merge.
