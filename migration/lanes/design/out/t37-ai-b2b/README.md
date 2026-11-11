# T37 evidence

Captured 2026-11-11 from canonical live www.zawlodzki.pl and the local Worker on port 8791. Browser fallback uses Playwright driving /opt/agent-vm/chromium/chrome because T3 preview is blocked by host AppArmor. verify-web up, doctor, probe, shot and down were also exercised. Optional cookies were rejected for section comparisons.

`live-*` and `new-*` compare unmodified public content with shared renderer changes. `patched-preview-problem-*` additionally uses the proposed content-dry-run.json sections in a local build-time fetch fixture, without a Sanity mutation. These are the caption acceptance screenshots. `regression-*` covers home, Sales Atlas System, about and contact. Width suffixes are 1440, 768 and 375 pixels. Sticky navigation can overlap the top of a scrolled section capture.

`browser-checks.json` records HTTP 200, duplicate-heading count one, no marketing field, no horizontal overflow, and the computed promo gradient. Browser attribution inputs may be rewritten by the existing attribution script. Static rendered contract checks independently pass with 32 hidden attribution fields on both contact forms (36 total contact fields). The inventory is absent, so the field-check fixture reconstructed legacy names from the Worker contract plus the removed marketing field.

`content-dry-run.json` is public page content and a revision-guarded proposed mutation, not an applied change. Generate again against a fresh page export before coordinator application. Rerunning the generator on the patched document produces zero mutations.

## PNG manifest

- [live-atlas-1440.png](live-atlas-1440.png)
- [live-atlas-375.png](live-atlas-375.png)
- [live-atlas-768.png](live-atlas-768.png)
- [live-contact-1440.png](live-contact-1440.png)
- [live-contact-375.png](live-contact-375.png)
- [live-contact-768.png](live-contact-768.png)
- [live-contact-page-1440.png](live-contact-page-1440.png)
- [live-contact-page-375.png](live-contact-page-375.png)
- [live-contact-page-768.png](live-contact-page-768.png)
- [live-logos-1440.png](live-logos-1440.png)
- [live-logos-375.png](live-logos-375.png)
- [live-logos-768.png](live-logos-768.png)
- [live-pricing-1440.png](live-pricing-1440.png)
- [live-pricing-375.png](live-pricing-375.png)
- [live-pricing-768.png](live-pricing-768.png)
- [live-problem-1440.png](live-problem-1440.png)
- [live-problem-375.png](live-problem-375.png)
- [live-problem-768.png](live-problem-768.png)
- [live-results-1440.png](live-results-1440.png)
- [live-results-375.png](live-results-375.png)
- [live-results-768.png](live-results-768.png)
- [new-atlas-1440.png](new-atlas-1440.png)
- [new-atlas-375.png](new-atlas-375.png)
- [new-atlas-768.png](new-atlas-768.png)
- [new-contact-1440.png](new-contact-1440.png)
- [new-contact-375.png](new-contact-375.png)
- [new-contact-768.png](new-contact-768.png)
- [new-contact-page-1440.png](new-contact-page-1440.png)
- [new-contact-page-375.png](new-contact-page-375.png)
- [new-contact-page-768.png](new-contact-page-768.png)
- [new-logos-1440.png](new-logos-1440.png)
- [new-logos-375.png](new-logos-375.png)
- [new-logos-768.png](new-logos-768.png)
- [new-pricing-1440.png](new-pricing-1440.png)
- [new-pricing-375.png](new-pricing-375.png)
- [new-pricing-768.png](new-pricing-768.png)
- [new-problem-1440.png](new-problem-1440.png)
- [new-problem-375.png](new-problem-375.png)
- [new-problem-768.png](new-problem-768.png)
- [new-results-1440.png](new-results-1440.png)
- [new-results-375.png](new-results-375.png)
- [new-results-768.png](new-results-768.png)
- [patched-preview-problem-1440.png](patched-preview-problem-1440.png)
- [patched-preview-problem-375.png](patched-preview-problem-375.png)
- [patched-preview-problem-768.png](patched-preview-problem-768.png)
- [regression-home-1440.png](regression-home-1440.png)
- [regression-home-375.png](regression-home-375.png)
- [regression-home-768.png](regression-home-768.png)
- [regression-kontakt-1440.png](regression-kontakt-1440.png)
- [regression-kontakt-375.png](regression-kontakt-375.png)
- [regression-kontakt-768.png](regression-kontakt-768.png)
- [regression-o-mnie-1440.png](regression-o-mnie-1440.png)
- [regression-o-mnie-375.png](regression-o-mnie-375.png)
- [regression-o-mnie-768.png](regression-o-mnie-768.png)
- [regression-sales-atlas-system-1440.png](regression-sales-atlas-system-1440.png)
- [regression-sales-atlas-system-375.png](regression-sales-atlas-system-375.png)
- [regression-sales-atlas-system-768.png](regression-sales-atlas-system-768.png)

## Grzesiek review corrections

The `live-results-*`, `new-results-*`, `live-atlas-*` and `new-atlas-*` PNGs were regenerated after the review. `review-measurements.json` records current live and revised Worker geometry and computed styles at 1440, 768 and 375. Earlier descriptions of cyan result surfaces and the small promo badge are superseded by this review.

Badge sizes match within 0.1 CSS px. Desktop is 190.8125 × 279.5; tablet is hidden (0 × 0) on live and new; phone is 180 × 263.65625. This sizing is scoped to the promo so the existing footer badge is unaffected.

Result backgrounds use `--surface-soft` (#f9fafb), numbers `--text-link` (#3a48cc), labels and descriptions `--text-body` (#1e2024). Satoshi numbers / labels / descriptions measure 45 / 20 / 17.5 px at 1440 and 36 / 16 / 14 px at 768 and 375. Cards have centred text, 24px padding and `--radius-sm` (6px) corners. Layout is four / two / one columns. Numeric cards reuse the imported numeric title and move the imported leading plus from description beside the number, without a Sanity write or count-up script.

Verification used the ordinary public-content build through verify-web on port 8791. No patched-content fixture was used for this review. Astro check and TypeScript pass; design detector returns [].
