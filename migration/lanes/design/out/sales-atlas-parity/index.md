# T32 — Sales Atlas parity evidence

All local captures use the real local Worker on port 8791. Proposed content is rendered only in the existing `/_ds/blocks-a` catalog; production data loading is byte-identical to T31. No dataset writes, deployment, DNS or publishing occurred.

## Defects and evidence

| Defect/state | Implementation | 1280 px live left / catalog right | 375 px live left / catalog right |
|---|---|---|---|
| Hero image badge | Hero.astro; schemaTypes/blocks.ts; Sections.astro; importer pages.py | [compare](compare-hero-w1280.png) | [compare](compare-hero-w375.png) |
| Nine tabs, initial | Tabs.astro; schemaTypes/blocks.ts; Sections.astro; importer pages.py | [compare](compare-tabs-default-w1280.png) | [compare](compare-tabs-default-w375.png) |
| Tab 04 by click | Tabs.astro | [compare](compare-tabs-click04-w1280.png) | [compare](compare-tabs-click04-w375.png) |
| Tab 04 by keyboard | Tabs.astro | [compare](compare-tabs-keyboard04-w1280.png) | [compare](compare-tabs-keyboard04-w375.png) |
| Ordered test between paragraphs | importer pages.py → ContentSection.astro (same proposed document in fixture and route) | [compare](compare-test-w1280.png) | [compare](compare-test-w375.png) |

Catalog anchors: `#t32-hero`, `#t32-tabs`, `#t32-test`. Fixture: `apps/web/src/pages/_ds/sales-atlas.json`, from `proposed.ndjson`. The test fixture passes the proposed contentSection directly to ContentSection.astro, exactly as Sections.astro will for the real route: tagline and heading fields plus intro containing prose, the numbered list and closing paragraphs. No slot override is used.

## Real routes and accessibility

Local hero captures `local-route-{sales-atlas-system,szkolenie-i-wdrozenie-pipedrive,audyt-crm-pipedrive}-hero-w{1280,375}.png` show current production data, no image badge or reserved badge box and the existing CTA. The two Pipedrive CTAs retain their own labels. `/o-mnie` was replaced with `/audyt-crm-pipedrive` because it has no hero with CTA.

`/sales-atlas-system` still renders the old flattened sections until the reviewed content patch is applied. Catalog proof demonstrates the proposed layout without a data-loading switch.

[browser-checks.json](browser-checks.json) records nine tab roles, selected/tabindex after ArrowDown, Home and End, labelled panels, one visible panel, tab 04 reached by keyboard on live and local, reduced-motion transition 0s/animation none, all nine panels and summaries visible with JavaScript disabled, one visible summary at all widths with JavaScript enabled, heading-xs card heading sizes and typed tagline chips, and scrollWidth == 375 for the catalog and all three real routes. `capture.mjs` reproduces the checks using local headless Chromium/Playwright. Cookies were dismissed in the browser; no consent code changed. Sticky navigation is hidden only by screenshot styling for section crops.

## Import/data

[import.diff](import.diff) compares all 28 pages ignoring generated `_key` changes: only `/sales-atlas-system` and `/szkolenie-i-wdrozenie-salesforce` differ. All 15 pane links survive; regression tests cover multiple standalone links and numbered prose order. [proposed.ndjson](proposed.ndjson) contains those two proposed pages. [production-patch.json](production-patch.json) is the exact sections replacement prepared for review, NOT applied. It uses existing mapped Sanity asset references. Recheck asset references and compare against current Studio sections before application; review concurrent editorial changes before replacing sections.

## Checks

- `typegen.log`: Studio schema extraction/typegen passed.
- `studio-check.log`: TypeScript and Sanity schema validation passed (0 errors/warnings).
- `studio-verify.log`: registered blocks/fields/Portable Text contract checks passed with `node scripts/verify-schema.mjs --schema-only`. Document validation requires Sanity login and was skipped per coordinator; no credentials used for verification.
- `astro-check.log`: 0 errors/warnings.
- `source-tests.log`: explicit source test files passed.
- `build.log`: normal pnpm build passed.
- `importer-tests.log`: 23 importer tests passed.
- `board-check.log`: board OK.
- `worker-doctor.log`, `worker-probe.log`, `worker-shot.log`: verify-web health, HTTP 200/noindex and shot. Historical `local-proof-blocked.log` records the discarded overlay attempt, not current proof.

## Deviations and intended visual differences

Coordinator approved `verify-schema.mjs` in owns on main (0e9aaa9). Its contract check now compares block sets independently of registration order. Added explicit schema-only mode because document validation needs a login; coordinator requested skipping it. No credentials are required for these checks.

Coordinator replaced the overlay approach with catalog fixtures; client.ts was restored exactly to T31 and the overlay test deleted. Coordinator later confirmed T31 merged and requested merging main plus a normal PR. T32 stays todo pending T31 board mark-done and coordinator claim.

Existing T31 design choices remain: copy precedes the larger portrait on mobile and text is left aligned; requested consultation CTA is kept. Badge placement/sizing follows live (standard 130/60px, wide Salesforce 200/70px). At all widths only the selected tab summary is expanded under JavaScript; all summaries stay in the DOM and remain readable with JavaScript off. Selection uses secondary-10 and a left accent bar; card headings use heading-xs; the imported tab-item tagline renders as a neutral chip. No fade is authored, including reduced motion. Test tagline/heading use the shared section styles; its body is rendered identically in catalog and the proposed real route.

PR #52 review corrections: refreshed all eight affected tabs/test comparisons at 1280/375, updated proposed documents/sections patch/import diff, and reran browser and build/schema/source/importer checks. Sanity document validation is still skipped per coordinator (login required).

## Studio content steps and prepared production patch

1. PL page `/sales-atlas-system` → hero → badgeImage: upload `https://cdn.prod.website-files.com/62e8050a7ce936c2cad0d6a1/6a7f87f4dd9e040eb3a74457_sales-atlas-system-pion.svg`; alt `Sales Atlas System badge`; badgeSize `standard`.
2. PL page `/szkolenie-i-wdrozenie-salesforce` → hero → badgeImage: upload `https://cdn.prod.website-files.com/62e8050a7ce936c2cad0d6a1/6a4fd5d9fc248b2db6691611_Salesforce.com_logo.svg.webp`; alt `Salesforce logo`; badgeSize `wide`.
3. Sales Atlas sections: replace flattened nine-layer contentSection with the `tabs` object in the proposed page, including all nine titles/summaries, positive/negative cards, body and all 15 inline links. Update the test contentSection: retain tagline `Test` and its heading, and replace intro with the proposed Portable Text stream (intro paragraph, three numbered items, two closing paragraphs); omit items. For each tab item set its tagline field from the proposed document (the “Od czego zacząć” chip); keep it outside body text.
4. Review `production-patch.json` against current published sections. This is the prepared exact mutation body if a later production write is explicitly approved; no mutation has been submitted. Keep the hero CTA unchanged (fallback remains).
