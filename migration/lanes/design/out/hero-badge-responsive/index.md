# T33 revised hero proof

Refreshed 2026-11-11 after PR #53 review. **Live left, local right** in every comparison. Chromium viewports: width × 1100. Images capture the complete hero and its CTA; original captures use `*-live.png` and `*-local.png`. Optional cookies declined to expose the portraits. Local runs through verify-web `web.sh up`, `doctor`, `probe`, and `shot`, port 8790, real `wrangler dev --local`. Playwright captures use the same Worker. Shared preview automation was unavailable due to host AppArmor.

| Page | 1280 | 1024 | 768 | 375 |
|---|---|---|---|---|
| Sales Atlas — standard badge | [1280](sales-atlas-system-1280-comparison.png) | [1024](sales-atlas-system-1024-comparison.png) | [768](sales-atlas-system-768-comparison.png) | [375](sales-atlas-system-375-comparison.png) |
| Salesforce — wide badge | [1280](szkolenie-i-wdrozenie-salesforce-1280-comparison.png) | [1024](szkolenie-i-wdrozenie-salesforce-1024-comparison.png) | [768](szkolenie-i-wdrozenie-salesforce-768-comparison.png) | [375](szkolenie-i-wdrozenie-salesforce-375-comparison.png) |
| Homepage — no badge | [1280](home-1280-comparison.png) | [1024](home-1024-comparison.png) | [768](home-768-comparison.png) | [375](home-375-comparison.png) |
| Sales audit — no badge | [1280](audyt-sprzedazy-1280-comparison.png) | [1024](audyt-sprzedazy-1024-comparison.png) | [768](audyt-sprzedazy-768-comparison.png) | [375](audyt-sprzedazy-375-comparison.png) |

## Cause and revised fix

The first revision fixed the full-column anchor but failed visually: the source photo has transparent margins, so negative offsets placed a small badge beside the visible torso. Fixed pixel badge widths also failed to track photo size. The initial text-first, height-capped portrait was far larger than live on narrow layouts.

Hero now puts a compact centered photo before centered copy through a 64rem container width (including all requested 1024/768/375 viewports). Portrait width is fluid from 112 to 144px in that layout. Wider containers retain two columns and a portrait capped at 436.8px. The photo/copy gap is 32px in compact layouts, 48px in columns. Badge placement is inset 3% from the photo box's left and extends 8% below it: this moves the badge over the visible lower-left torso instead of leaving it outside the transparent image edge. No clipping is introduced.

Badge widths are proportions of the photo: standard 46% compact / 34% columns; wide 55% compact / 52% columns. For comparison, live standard ratios at the requested widths range roughly 30–53%, wide 46–62%. Both variants visibly overlap the portrait in the refreshed captures. CTA content/links and optional badge rendering are unchanged. Homepage and sales-audit controls have no badge node or reserved badge space.

## Intended differences from live

At exactly 1024px live still has desktop columns. Per Grzesiek's review request, local instead keeps the compact photo-first layout through that width. At 768/375 local follows live's photo-first compact centered composition. Local has the migration's existing navigation without the old promotional strip, so its hero starts higher. Existing copy, CTA, typography and section styling can differ; this task changes only the shared Hero layout/overlay. Transparent image edges are deliberately crossed inward so the badge covers the actual portrait.

## Verification

`measurements.json` contains all 32 rendered captures: photo/wrapper/badge rectangles, copy rectangle, badge ratio/count, CTA text and document scroll width. These supplement direct screenshot inspection, which is the evidence for overlap of the visible cut-out, not only its transparent box.

- Both badged routes: `scrollWidth == 375` at width 375.
- All four local pages: photo precedes copy at 1024/768/375; compact photo widths are 144/144/112px.
- Both controls: zero badge nodes at every requested width; no badge placeholder or badge-only spacing.
- `astro-check.log`: 0 errors/warnings, 1 existing hint.
- `build.log`: production build passes, 117 pages.
- `node-test-src.log`: literal `node --test src` still fails MODULE_NOT_FOUND under Node 24.22.2.
- `node-tests-expanded.log`: explicit source test files pass 81, skip 1, fail 0.
- `design-detector.json`: no findings.
- `probes.tsv`: all four local routes return 200 with non-production noindex headers.
- Board check passes; verify-web stopped after proof. No Sanity writes, deployment or merge.
