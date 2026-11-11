# T45. Optional tab CTAs

Tabs now accept optional `primaryCta` and `secondaryCta`, both using the existing `link` schema. The renderer reuses Button's primary and secondary variants and safe URL handling. With neither link, no actions wrapper is emitted. Buttons wrap naturally and use the existing full-width mobile rule.

The local component type extends the generated tab item type. T39's `sanity.types.ts` and `objects.ts` were not edited. Regenerate Sanity types after coordinating with T39.

## Current course and content proposal

Read the published production document on 2026-11-11 through the public Sanity query API, with perspective `published`. See `course-dry-run.json` for revision and section types. There are **zero tabs**. The program heading “Osiem modułów, osiem rozwiązań na koniec” belongs to `feature`, key `0739dd40c754`. No conversion or production mutation was performed.

Intended additional link is “Zapytaj o pracę na Twoim CRM” → `/kontakt`. No purchase or presale link is proposed. Because there is no target tab, the current change list and mutation list are empty. Adding this CTA to the actual course requires a separately scoped content/layout decision.

`node migration/tools/import/pages-t45-cta-patch.mjs export.json report.json` plans from a fresh export or public query result. It emits only offline JSON. For course tabs, it proposes keyed secondaryCta paths guarded by `ifRevisionID`, refuses conflicting existing CTAs, and skips matching CTAs. It does not invent a primary CTA or change unrelated documents. Any later application remains a human gate.

## Verification

- Locked dependencies installed. `pnpm --filter web check` passed with zero errors/warnings and one existing Worker hint. `pnpm --filter studio check` passed including schema validation with zero errors/warnings.
- verify-web `up`, `doctor`, `probe`, `shot` and `down` used port **8791**, `wrangler dev --local`, production build. No Astro dev server. Final run `20261111-164029-p8791`.
- `probes.tsv` records 200 and `noindex, nofollow` for fixture, course and Sales Atlas.
- `tabs-w1440.png` and `tabs-w390.png` visually inspected. Matching rendered DOM included. Desktop buttons are adjacent. Mobile buttons stack without horizontal overflow.
- `interaction.json` records CDP assertions at real viewport widths 1440 and 390. ArrowDown selects the tab without CTA and emits no actions; clicking the third tab shows secondary-only CTA. Sales Atlas has no CTA action wrappers.
- Shared T3 preview could not start because this host blocks its sandbox through AppArmor. Used installed headless Chromium, with no-sandbox wrapper, for web.sh captures and CDP interaction checks. To replay, start verify-web on 8791, set `CHROME_BIN`, then run `node migration/tools/import/pages-t45-browser-check.mjs report.json`. Its Chromium process/profile are cleaned up.
- Expanded owns with `apps/web/src/pages/_ds/blocks-a.astro` to provide isolated, noindex fixture coverage without Sanity writes. No contract changes.
- Prove It Works guided verification against the built Worker and actual browser interaction rather than build success alone.
