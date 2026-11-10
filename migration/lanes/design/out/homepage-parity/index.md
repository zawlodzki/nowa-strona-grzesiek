# T31 visual proof

Captured 2026-11-10 from live `https://zawlodzki.pl/` and the built Astro site behind local `wrangler dev --local` on port 8790. Browser: headless Chromium, device scale 1, 1280/375 px. No deploy or dataset writes.

The coordinator's later requirement supersedes live's default colour logos: both client and tool strips are muted until hover/focus. The white-artwork inversion remains in every state. Existing accessible form labels and larger tap targets are preserved; this is evidence for the listed defects, not a claim of identical pixels throughout the migration.

## Defect comparisons

Each pair is live on the left, local Worker on the right. Individual source crops and full homepage screenshots are also included.

| Defect | Shared component | 1280 px | 375 px |
|---|---|---|---|
| 1 | LogoMark | [comparison](compare-header-w1280.png) | [comparison](compare-header-w375.png) |
| 2 | Hero | [comparison](compare-hero-w1280.png) | [comparison](compare-hero-w375.png) |
| 3 | LogoStrip | [comparison](compare-logos-w1280.png) | [comparison](compare-logos-w375.png) |
| 4 | ContentSection | [comparison](compare-services-w1280.png) | [comparison](compare-services-w375.png) |
| 5 | Feature | [comparison](compare-about-w1280.png) | [comparison](compare-about-w375.png) |
| 6–7 | ContactForm / LeadForm | [comparison](compare-contact-w1280.png) | [comparison](compare-contact-w375.png) |
| 7–9 | NewsletterSignup / LeadForm | [comparison](compare-newsletter-w1280.png) | [comparison](compare-newsletter-w375.png) |
| 10 | Footer / SalesAtlasBadge | [comparison](compare-footer-w1280.png) | [comparison](compare-footer-w375.png) |

Homepage full captures: [live-home-w1280.png](live-home-w1280.png) · [live-home-w375.png](live-home-w375.png) · [local-home-w1280.png](local-home-w1280.png) · [local-home-w375.png](local-home-w375.png)

## Every logo strip: default, hover and keyboard focus

Hover images use CDP `CSS.forcePseudoState` on the actual logo cells, without CSS edits. Focus uses a keyboard event then real DOM focus; computed `:focus-visible`, solid outline and full opacity are checked in [logo-states.json](logo-states.json). White logos keep `invert(1)` on focus and hover. Reduced motion disables transitions. Strip 0 is clients; strip 1 is tools on both routes.

| Route | Strip | 1280 default | 1280 hover | 1280 focus | 375 default |
|---|---|---|---|---|---|
| `/` | 0 | [default](home-strip-0-w1280-default.png) | [hover](home-strip-0-w1280-hover.png) | [focus](home-strip-0-w1280-focus.png) | [default](home-strip-0-w375-default.png) |
| `/` | 1 | [default](home-strip-1-w1280-default.png) | [hover](home-strip-1-w1280-hover.png) | [focus](home-strip-1-w1280-focus.png) | [default](home-strip-1-w375-default.png) |
| `/automatyzacje-dla-pipedrive` | 0 | [default](automatyzacje-strip-0-w1280-default.png) | [hover](automatyzacje-strip-0-w1280-hover.png) | [focus](automatyzacje-strip-0-w1280-focus.png) | [default](automatyzacje-strip-0-w375-default.png) |
| `/automatyzacje-dla-pipedrive` | 1 | [default](automatyzacje-strip-1-w1280-default.png) | [hover](automatyzacje-strip-1-w1280-hover.png) | [focus](automatyzacje-strip-1-w1280-focus.png) | [default](automatyzacje-strip-1-w375-default.png) |

[All 36 public logo assets: pixel audit](logo-artwork-audit.json) identifies exactly three white artworks: smmash, iimarbella and deky expo. All other logos contain darker/coloured pixels. No schema change was needed.

## Shared-component regression pages

Each page was inspected at both widths, including header/footer and contact/newsletter/logos where present. Full-page captures plus individual section crops use the `local-route-<slug>-<section>-<index>-w<width>.png` pattern. Omitted sections are absent from the published page data, rather than injected for proof.

| Route | 1280 | 375 | Present shared sections |
|---|---|---|---|
| `/blog/bezpieczne-przekazanie-danych` | [full](local-route-bezpieczne-przekazanie-danych-w1280.png) | [full](local-route-bezpieczne-przekazanie-danych-w375.png) | [local-route-bezpieczne-przekazanie-danych-header-0-w1280.png](local-route-bezpieczne-przekazanie-danych-header-0-w1280.png) · [local-route-bezpieczne-przekazanie-danych-footer-0-w1280.png](local-route-bezpieczne-przekazanie-danych-footer-0-w1280.png) · [local-route-bezpieczne-przekazanie-danych-newsletter-0-w1280.png](local-route-bezpieczne-przekazanie-danych-newsletter-0-w1280.png) |
| `/szkolenie-i-wdrozenie-pipedrive` | [full](local-route-szkolenie-i-wdrozenie-pipedrive-w1280.png) | [full](local-route-szkolenie-i-wdrozenie-pipedrive-w375.png) | [local-route-szkolenie-i-wdrozenie-pipedrive-header-0-w1280.png](local-route-szkolenie-i-wdrozenie-pipedrive-header-0-w1280.png) · [local-route-szkolenie-i-wdrozenie-pipedrive-footer-0-w1280.png](local-route-szkolenie-i-wdrozenie-pipedrive-footer-0-w1280.png) · [local-route-szkolenie-i-wdrozenie-pipedrive-contact-0-w1280.png](local-route-szkolenie-i-wdrozenie-pipedrive-contact-0-w1280.png) · [local-route-szkolenie-i-wdrozenie-pipedrive-logos-0-w1280.png](local-route-szkolenie-i-wdrozenie-pipedrive-logos-0-w1280.png) |
| `/kontakt` | [full](local-route-kontakt-w1280.png) | [full](local-route-kontakt-w375.png) | [local-route-kontakt-header-0-w1280.png](local-route-kontakt-header-0-w1280.png) · [local-route-kontakt-footer-0-w1280.png](local-route-kontakt-footer-0-w1280.png) · [local-route-kontakt-contact-0-w1280.png](local-route-kontakt-contact-0-w1280.png) · [local-route-kontakt-newsletter-0-w1280.png](local-route-kontakt-newsletter-0-w1280.png) |
| `/o-mnie` | [full](local-route-o-mnie-w1280.png) | [full](local-route-o-mnie-w375.png) | [local-route-o-mnie-header-0-w1280.png](local-route-o-mnie-header-0-w1280.png) · [local-route-o-mnie-footer-0-w1280.png](local-route-o-mnie-footer-0-w1280.png) · [local-route-o-mnie-newsletter-0-w1280.png](local-route-o-mnie-newsletter-0-w1280.png) |
| `/newsletter` | [full](local-route-newsletter-w1280.png) | [full](local-route-newsletter-w375.png) | [local-route-newsletter-header-0-w1280.png](local-route-newsletter-header-0-w1280.png) · [local-route-newsletter-footer-0-w1280.png](local-route-newsletter-footer-0-w1280.png) · [local-route-newsletter-newsletter-0-w1280.png](local-route-newsletter-newsletter-0-w1280.png) |

The matching `-w375.png` section crops are alongside each desktop crop. [Rendered checks](render-checks.json): `/` and every regression page have `scrollWidth == viewportWidth` at 375 and 1280; no visible broken images. The hidden mobile about portrait is intentionally lazy and excluded from visible-image failures.

## Worker, forms and automated checks

- [HTTP probes](probes.tsv): all six routes return 200, HTML and staging `noindex, nofollow` headers. `verify_*.png` are the direct `web.sh shot` captures at both widths; `local-route-*` are full-page supplements against the same verified Worker.
- [Forms proof](forms-proof.json), [mock delivery](form-delivery.json): landing contact, newsletter, full contact return 303 and navigate to their thank-you routes. Payloads contain 37/34/37 fields, including all 32 attribution keys. Newsletter is `true`, matching the former checked checkbox. Unknown-form errors are shown and re-enable submit; a missing Turnstile token returns 403. Widgets have zero rendered height and produce real test tokens.
- Static Worker HTML emits all 32 attribution inputs. The existing consent loader removes optional inputs when consent is denied (six remain in the runtime DOM); the Worker still forwards all 32 keys with empty optional values. No consent behavior changed.
- Local bindings were passed through an isolated process environment with `CLOUDFLARE_INCLUDE_PROCESS_ENV=true`, mock receiver on 8791 and Cloudflare's published test secret. No `.env`, site key or Worker secret was changed. No production form was submitted.
- [Astro check](astro-check.txt): 0 errors, 0 warnings, one pre-existing hint. [Source tests](source-tests.txt): 81 passed, 1 skipped, 0 failures. Node 24 does not accept the literal `node --test src` directory command here (`MODULE_NOT_FOUND`); equivalent command: `node --test $(rg --files src -g '*.test.ts' -g '*.test.mjs')`.
- [Build](build.txt): 117 pages built successfully. [Design detector](design-detector.json): one intentional gradient-text warning; the user's explicit live-gradient requirement takes precedence.

## Reproduction

Run verify-web `up`, `doctor`, `probe`, `shot` and `down` per the repository skill on port 8790. `CHROME_BIN` may point to a wrapper adding `--no-sandbox` on this host. `capture.mjs`, `logo-states.mjs` and `forms-proof.mjs` accept `PLAYWRIGHT_MODULE` (an installed playwright-core module path) and `CHROME_BIN` (the browser binary). Browser dependencies and wrappers used for this run live only in `/tmp`.

## Follow-ups

Defect 11: service-heading accent words remain plain content. A typed editorial emphasis model/content change needs a separate task; no heading-string substitutions or schema/dataset writes were introduced. Existing typography, label and spacing differences outside defects 1–10 remain the migration's design-system refinements.
