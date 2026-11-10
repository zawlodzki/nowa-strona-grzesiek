# T32 — incomplete, blocked

No dataset writes, deployment, DNS changes or publishing performed.

## Implementation

- Hero: optional `badgeImage` (`contentImage`, required alt on use) and `badgeSize`; resolved in `Sections.astro`, overlaid in `Hero.astro`. Consultation fallback retained.
- Tabs: schema in `schemaTypes/blocks.ts`, reusable `Tabs.astro`, importer preserves pane links and content. Progressive enhancement: all panels visible without JavaScript; JS supplies vertical tab semantics, roving tabindex, Up/Down/Home/End. No authored animation, including reduced motion. These browser claims still need runtime verification.
- Ordered prose: importer emits existing `richText`, keeping heading, introduction, numbered list and closing paragraphs in source order.
- `proposed.ndjson`, `production-patch.json`: proposed documents and sections patches, NOT applied. Asset references come from the existing read-only asset map. Revalidate references and published document revisions before approval/application; sections replacement includes importer output and must be reviewed against later Studio edits.
- `import.diff`: semantic diff ignoring `_key` values; only `/sales-atlas-system` and `/szkolenie-i-wdrozenie-salesforce` changed among all 28 imported pages.

## Verification and blockers

`astro-check.log`, `build.log`, `studio-check.log`, `source-tests.log`, `importer-tests.log`, `board-check.log` hold executed checks. Studio typegen succeeds, but `studio-verify.log` fails because `apps/studio/scripts/verify-schema.mjs` hardcodes the previous block list and does not allow tabs. This script is outside T32 owns.

`local-proof-blocked.log`: Astro local static build sets NODE_ENV=production; the overlay rejects it. Automatic approval review rejected replacing this guard with a local flag because it could permit overlays in production builds. The guard remains intact. No screenshots, keyboard/browser a11y, reduced-motion or overflow proof are claimed. Worker on 8791 was never started; verify-web down confirms no instance.

Live CSS inspected at `https://cdn.prod.website-files.com/62e8050a7ce936c2cad0d6a1/css/zawlodzki.webflow.shared.501ca6d23.min.css`; tabs stack and move panels above menu at max-width 991px. State surfaces use existing nearest tokens because the token stylesheet is outside owns. The consultation CTA intentionally differs from live as requested.

## Studio badge steps (after schema delivery)

1. PL page `/sales-atlas-system` → hero → badgeImage: upload `https://cdn.prod.website-files.com/62e8050a7ce936c2cad0d6a1/6a7f87f4dd9e040eb3a74457_sales-atlas-system-pion.svg`; alt `Sales Atlas System badge`; badgeSize `standard`.
2. PL page `/szkolenie-i-wdrozenie-salesforce` → hero → badgeImage: upload `https://cdn.prod.website-files.com/62e8050a7ce936c2cad0d6a1/6a4fd5d9fc248b2db6691611_Salesforce.com_logo.svg.webp`; alt `Salesforce logo`; badgeSize `wide`.
3. Review `production-patch.json` against current production sections before approving any application. It replaces the Sales Atlas flattened tabs with `tabs` and ordered prose with `richText`, and sets badge data on both pages. No write is authorized or performed here.
