# T54 evidence: reusable sections

Date: 2026-11-13. Local Studio (`SANITY_STUDIO_DATASET=development pnpm dev --port 3333`) and a local build on the **development** dataset. Production dataset: not written (`count(*[_type=="reusableSection"])` = 0). Studio not deployed.

## What exists now

- `reusableSection` document ("Sekcja"): `name` (Studio-only label), `language` (pl/en, default pl), `section` (exactly one block: `contactForm`, `newsletterSignup` or `ctaBand`).
- Studio menu "Sekcje" lists these documents, right after "Strony prawne"; the type is not listed twice.
- `sectionRef` block ("Sekcja wspólna") in `page.sections`: one required reference to a `reusableSection` in the page's language.
- `apps/web/src/lib/sanity/site.ts` fetches `reusableSections` and replaces each `sectionRef` with a copy of the referenced block at parse time, keeping the page's `_key`. Every reader of `sections` (Sections.astro, RouteView heading logic, Markdown output, SEO) sees an ordinary inlined block, so `Sections.astro` needed no change. A reference to a section that is not published is dropped with one build warning instead of failing the build.

## Proof

| Done when | Evidence |
| --- | --- |
| Studio has a "Sekcje" category | `studio-sekcje-created.jpg`: menu item "Sekcje", a document "T54 dowód: newsletter wspólny" created in the UI with a Newsletter block, published (development). The block picker offers only Formularz kontaktowy, Newsletter, Wezwanie do działania. |
| A page can include `sectionRef` | `studio-page-sectionref.jpg`: page `/t54-sekcja-wspolna` (id `t54-section-ref-proof`, development) with a "Sekcja wspólna" block added in the UI; the reference picker listed only the PL section. |
| The site renders the referenced section | `page-sectionref-rendered.jpg`: `SANITY_DATASET=development astro build`, page served from `dist/`. Heading "Sekcja wspólna T54" and body "T54: ten tekst pochodzi z dokumentu Sekcja, nie ze strony." come from the Sekcja document. |
| Resolution rules | `section-ref.test.ts` (4 pass): order and page `_key` kept, two refs get separate copies, inlined sections untouched, missing target skipped with a warning, query result without `reusableSections` still parses. Run: `node --test migration/lanes/cms/out/t54-reusable-sections/section-ref.test.ts` |

## Development dataset cleanup

The proof documents `0b4778c5-dba9-4aaf-a6d3-2fb073062646` (reusableSection) and `t54-section-ref-proof` (page `/t54-sekcja-wspolna`) were deleted from `development` on 2026-11-13 after the screenshots. To repeat the proof, create a Sekcja and a page with a "Sekcja wspólna" block in local Studio again.
