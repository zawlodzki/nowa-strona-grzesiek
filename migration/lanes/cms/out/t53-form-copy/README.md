# T53 evidence: editable form and newsletter texts

All runs went through the real Worker (`web.sh up --port 8790`, `wrangler dev --local`) on 2026-11-12, with content from the published `production` dataset (read only).

## Files

- `compare-forms.mjs`: compares every `section.contact` and `section.newsletter` between two `apps/web/dist` builds. `compare-forms.txt` is its output for the build at `f97f8b7` against the T53 build: 107 pages with forms, 0 differing.
- `shoot-forms.mjs`: headless Chrome over CDP. Clips each form section to a PNG and prints a sha256 per PNG.
- `shots/before/hashes-*.txt`: hashes from the `f97f8b7` build. `shots/after/`: the T53 build (PNGs at 1280; the before PNGs were byte-identical, so they are not kept).
- `shots/override/` and `override-dom.txt`: a temporary uncommitted page `/_ds/t53-override-check` rendering both blocks with every new `copy` field filled.
- `live-vs-new/`: full 1280×2600 shots of `/kontakt` and `/newsletter` on live www.zawlodzki.pl and on the T53 build.
- `probes.tsv`: `web.sh probe` lines. `checks.txt`: lint, type checks, schema validation, tests, contract drift and a grep for form wiring.

## Results

- Rendered markup: byte-identical form and newsletter sections on all 107 pages that have one (`compare-forms.txt`). Across the whole build, the only other change is the order of two `<link rel="stylesheet">` tags (`Testimonials.*.css` and `RouteView.*.css`) on 113 pages. Both CSS files are byte-identical. The reorder comes from `NewsletterSignup.astro` now importing `safeHref`.
- Pixels: at 1280, all 10 form sections on `/`, `/kontakt`, `/newsletter`, `/blog`, `/o-mnie`, `/kurs-ai-w-sprzedazy` and `/blog/asana-ai` hash the same before and after. At 375, the first run differed on `kontakt-0` and `newsletter-0`. A rerun on the same T53 build reproduced the baseline hashes exactly (`7eba0461…`, `5fb02e0e…`, `8a952efd…`). On the same build, `/newsletter` at 375 alternates between `8a952efd…` and `ee0c94f9…` from run to run: an overlay at the bottom edge of the viewport is timing dependent. So the stylesheet reorder does not change rendering.
- Override: every filled field replaces its default (`override-dom.txt`), including `data-wait` on the submit button and the edited legal links. The consent banner covers part of the override PNGs; the DOM extract is the full proof.
- Live wording: live `/`, `/kontakt` and `/newsletter` contain every default string except `(wymagane)`, which is visually hidden and predates T53. Live `/kontakt` also has a marketing checkbox that T37 removed on purpose.
