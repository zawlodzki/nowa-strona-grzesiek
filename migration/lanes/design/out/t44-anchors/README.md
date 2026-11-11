# T44 heading anchor verification

Counts include all h2/h3 in the document. Remaining id-less headings are outside the approved scope.

| Page | Before ids / headings | After ids / headings |
| --- | --- | --- |
| /szkolenie-i-wdrozenie-asana | 4 / 32 | 28 / 32 |
| /audyt-sprzedazy | 4 / 33 | 29 / 33 |
| /szkolenie-i-wdrozenie-pipedrive | 4 / 33 | 29 / 33 |
| /wdrozenie-ai-w-sprzedazy-b2b | 4 / 32 | 28 / 32 |
| /kurs-ai-w-sprzedazy | 4 / 43 | 39 / 43 |
| /sales-atlas-system | 1 / 18 | 14 / 18 |
| /blog/asana-vs-jira | 3 / 19 | 12 / 19 |

All six service pages have ids on every main-content h2/h3. The four id-less headings per page are footer navigation headings (CRM, AI, Asana, Materiały). The blog also has three id-less related-post card headings from PostCards, outside T44 ownership. Tabs was not changed; any headings it renders remain T45 responsibility.

## Reproduce

Install workspace dependencies. The browser runner needs playwright-core (PLAYWRIGHT_CORE may override the VM default path) and Chromium. Run verify-web up and doctor on free port 8790, then `node migration/lanes/design/out/t44-anchors/verify.cjs after`; always run verify-web down afterward. Use phase `before` on the parent renderer sources for the baseline, or `rebuild` for a second build. Compare after-counts.json with rebuild-counts.json.

The baseline used unchanged renderer sources from 3be4c2d. The runner captures actual Worker URLs. No Astro dev server or Sanity writes were used.

navigation.json records direct hash navigation at 1440 and 390. Headings land approximately 120px below the viewport top; header bottoms are 72px and 61px. compare-*.png puts live Webflow on the left and the local Worker on the right. Live is a visual reference, not an assertion of full design parity. The existing live banner/header and typography differ.

The 7.5rem scroll margin changes no normal-flow layout. No decorative # link was added. Existing aria-linked heading ids remain intact, including kontakt-heading.

T39 compatibility is documented in t39-compatibility.json. The rerunnable script reads origin/task/T39-post-layout with git show and compares its actual postOutline result with the shared helper. Both use NFKD Polish-safe slugs, the post- prefix, and the block key on duplicates. T39 PostBody already renders outline headings itself and passes only non-heading blocks to PortableText, so it does not allocate or replace TOC ids twice. Service headings use numeric -2/-3 suffixes instead.

Principle Model the Domain informed the request-scoped id allocator. Principle Prove It Works informed server-HTML, full-document uniqueness, rebuild stability, and direct-navigation checks.
