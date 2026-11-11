# T34 proof — About, contact channels and shared testimonials

Live Webflow vs local Cloudflare Worker on port 8791, 2026-11-11. Local `/o-mnie` uses the proposed production patch through an explicit local-only build overlay; homepage keeps its production section list. No dataset mutations, deployment or merge.

## Screenshot map

For each width **1280** and **375**, the following files place live on the left and local on the right:

- `compare-about-full-w{width}.png`: complete `/o-mnie`.
- `compare-article-w{width}.png`: entire article with right portrait on desktop; portrait hidden on mobile.
- `compare-contact-w{width}.png`: channels-only contact, social and direct groups, no lead form.
- `compare-opinions-w{width}.png`: about opinions rendered with the shared Testimonials block.
- `compare-home-opinions-w{width}.png`: homepage opinions through the same component.
- `fixture-author-linkedin-w{width}.png`: catalog card with real demonstration photo, LinkedIn icon and separate recommendation image. Fixture identity/copy is synthetic.

Individual `live-*` / `local-*` images are the inputs. `browser-checks.json` records DOM assertions: 375px scrollWidth, desktop sticky/64px inset, mobile hidden media, five social icons, no about lead form, absent optional author fields, optional-field fixture, one contact form on homepage and `/kontakt`, and one pair of quote marks.

## Reproduce (local only)

From repository root, with installed pnpm dependencies and read access to the public Sanity query API:

```bash
python3 -I migration/lanes/design/out/o-mnie-parity/local-overlay.py
T34_LOCAL_PROOF=1 T34_LOCAL_DOCUMENTS=/tmp/T34-overlay.json VERIFY_WEB_HOME=/tmp/T34-verify .claude/skills/verify-web/scripts/web.sh up --port 8791
VERIFY_WEB_HOME=/tmp/T34-verify .claude/skills/verify-web/scripts/web.sh doctor --port 8791
VERIFY_WEB_HOME=/tmp/T34-verify .claude/skills/verify-web/scripts/web.sh probe /o-mnie --port 8791
PLAYWRIGHT_MODULE=/tmp/t31-browser/node_modules/playwright-core/index.mjs node migration/lanes/design/out/o-mnie-parity/capture.mjs
CHROME_BIN=/opt/agent-vm/chromium/chrome VERIFY_WEB_HOME=/tmp/T34-verify .claude/skills/verify-web/scripts/web.sh shot /o-mnie --port 8791 --width 375
VERIFY_WEB_HOME=/tmp/T34-verify .claude/skills/verify-web/scripts/web.sh down --port 8791
```

Overlay requires both explicit variables and a `/tmp/` path, rejects CI/Cloudflare credentials/CI environments and the deploy lifecycle, and makes no mutation requests. Normal builds omit both variables. Do not deploy the proof build; use a clean ordinary build. T3 preview automation was unavailable due to host AppArmor; fallback Playwright Chromium drove these proofs. No host changes.

## Content and differences

`production-patch.json` is a **proposal**, not an executed request. It creates missing shared testimonial documents, patches retained recommendation images on existing testimonials, and replaces only the about page's sections. `proposed-documents.json` holds the proposed about document and testimonial documents. `import-diff.txt` compares the old and new offline import of every page/testimonial; only `/o-mnie` and two existing testimonial documents change. `/kontakt`, homepage and other imported pages are unchanged.

The snapshot nests complete contact/testimonials divs inside the article's feature div. The importer lifts these complete sections before parsing the article; it does not split article h2s. It recognizes structure rather than the about URL. Other Feature variants retain their layout.

Intended differences from Webflow: existing fluid type/spacing tokens, accessible contrast, shared rounded media/cards, shared brand-icon stroke style and 44px link targets remain. The article uses the headline-sized h1, a 45rem prose cap, one desktop 1fr/.5fr grid and compact heading rhythm; 4rem sticky inset is 64px with the standard root (Webflow's 20px root makes its 4rem 80px). Shared quote typography uses one `„…”` pair after stripping wrapping CMS quotes. Shared source/name/company layout remains. Existing homepage company-logo images are now retained on shared testimonial documents, so about cards also show those logos; these are separate from optional author portraits. Live about cards have no author photo or LinkedIn URL; those remain absent. No copy, claims, company details, recent-post or newsletter redesign.

## Checks and limitations

- Astro check: zero errors/warnings (one pre-existing hint).
- Web build: 117 pages; clean ordinary production-data build and local overlay build both pass.
- Source discovery: 82 tests pass. Literal `node --test src` fails on Node 24 because the directory is treated as a module; equivalent explicit discovery `node --test $(rg --files src -g '*.test.ts' -g '*.test.mjs')` passes.
- Importer: 25 tests pass, including nested sections, retained card media, author photo and LinkedIn mapping.
- Studio typegen, TypeScript/schema check and `verify-schema.mjs --schema-only` pass. The full file-document validator requires `sanity login` in this environment (see document-validation.log); no login/dataset write was attempted. Existing contentImage validation requires alt for populated images, linkedinUrl uses HTTPS-only URI validation.
- Impeccable detector: no findings. Task board passes.

Good-css was read from upstream `vojtaholik/good-css`, `skills/good-css/SKILL.md`, with applicable layout, spacing, media and interaction references. Upstream HEAD `35e0e8c` supplies the file last changed at `92d436ba`. File SHA256 `30b8858e7b407fa00196d6b242d943b202860f1d9f4dd9348fa79f0b1d950375`; the lock's `computedHash` is `882dc3f6cb2ad58b3569af84a8c67668cda0284b156b27f8a8d989bd98063958` (not a matching raw file SHA256). No repo skill links were modified.
