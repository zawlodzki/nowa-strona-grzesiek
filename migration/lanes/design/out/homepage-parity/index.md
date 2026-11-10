# T31 visual proof

**Final approved contact refinements:** see [Centred header, form heading and profile photo](#centred-header-form-heading-and-profile-photo). [Full-width contact submit](#full-width-contact-submit) remains the current button evidence. [Hidden labels and placeholders](#hidden-labels-and-placeholders) remains the current label/a11y evidence. These `*-labels-*` captures supersede the visible field labels in earlier proof. [PR #50 follow-up proof](#pr-50-follow-up-proof) remains the latest footer/badge evidence.

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

## PR #50 follow-up proof

Shared NewsletterSignup now puts the email input and submit button in the same grid row, with equal heights (57px desktop, 50px mobile), centred vertically; the visible accessible label occupies its own row. The live row is also horizontal at 375px (no mobile stack). Live itself centres a 44px input against a 57/50px button; this implementation follows the user's explicit requirement for equal control heights while preserving live's centre line, 8px desktop/0px mobile gap, input padding and secondary button border/padding.

Shared Footer now matches live computed link, title and legal-nav typography: desktop 20px/35px line-height, mobile 16px/28px; links weight 400, titles 600; link colour rgb(99,107,117), title colour rgb(14,15,17). The root font remains unchanged; component-local fluid values reproduce the measured endpoints.

| Comparison | 1280 px | 375 px |
|---|---|---|
| Newsletter row | [live vs local](compare-review-newsletter-row-w1280.png) | [live vs local](compare-review-newsletter-row-w375.png) |
| Newsletter section | [live vs local](compare-review-newsletter-w1280.png) | [live vs local](compare-review-newsletter-w375.png) |
| Footer | [live vs local](compare-review-footer-w1280.png) | [live vs local](compare-review-footer-w375.png) |

**Live's badge is animated.** Its masked conic-gradient frame and glow copy rotate over 11s, breathe opacity over 4.4s and pulse brightness over 6.7s, infinitely. The shared SalesAtlasBadge now includes all layers/effects. Reduced motion has no active animations, a frozen 288-degree rotation and live's --sas-moc opacity. Dimensions match live: approximately 68.27×100px desktop and 54.61×80px mobile, using fluid local dimensions instead of changing the root font. Existing palette tokens supply the gradient colours; the pale cyan is derived from cyan/white.

| Time in native CSS animation timeline | Live | Local Worker |
|---|---|---|
| 0s | [frame](live-review-badge-t0.png) | [frame](local-review-badge-t0.png) |
| 3s | [frame](live-review-badge-t3.png) | [frame](local-review-badge-t3.png) |
| 6s | [frame](live-review-badge-t6.png) | [frame](local-review-badge-t6.png) |
| Reduced motion at 1280 | [frame](live-review-badge-reduced-w1280.png) | [frame](local-review-badge-reduced-w1280.png) |
| Reduced motion at 375 | [frame](live-review-badge-reduced-w375.png) | [frame](local-review-badge-reduced-w375.png) |

Frames use the real browser CSS animations, paused and sought to exactly 0/3/6 seconds via the Web Animations API so screenshot latency cannot change the compared phases. No animation/CSS replacement was used. [Badge animation props + reduced-motion result](review-badge-animation.json) and [full geometry, typography and cross-page assertions](review-computed.json) include animation-name/duration/iteration, transforms, opacity, glow filter and active animation counts.

[Reproducible capture driver](review-proof.mjs) checks the shared newsletter on `/`, `/newsletter`, `/kontakt` and `/blog/bezpieczne-przekazanie-danych` at 1280/375. It asserts equal heights/centres and no overflow, exact rendered sRGB typography agreement and no active reduced-motion animations. `review-home-w*.png` and `review-newsletter-w*.png` are additional direct verify-web `shot` captures from run `20261110-174624-p8790`.

Validation: [Astro check](review-astro-check.txt), [source tests](review-source-tests.txt), [117-page build](review-build.txt). Requested literal [`node --test src`](review-node-test-src.txt) was rerun and still fails with MODULE_NOT_FOUND on Node 24; explicit source test paths pass (81 passed, one skipped, zero failed), as documented above. Board check: 31 tasks, 0 problems.

## Hidden labels and placeholders

Approved shared-component change: field labels in NewsletterSignup and ContactForm remain in the DOM with their existing text and for/id associations, but use one `visually-hidden` utility defined in LeadForm (the same clip-path/1px/overflow-clip/nowrap pattern as Header). Checkbox consent labels remain visible. No display:none, visibility:hidden or aria-hidden is used for field labels. The newsletter's hidden label does not reserve a grid row; input and button remain equal-height and centred horizontally on desktop and mobile.

Exact placeholders copied from live on both homepage and `/kontakt`: **E-mail**, **Telefon**, **Temat rozmowy**; newsletter: **Adres e-mail**. Email remains required; phone/message remain optional. Contact controls match live's 44px input/96px textarea height, 8px×12px padding, 1px border, 6px radius, 20px desktop/16px mobile font and 10/7 line-height. The shared input selector uses :where to let the textarea's own minimum height win. Hidden attribution/Turnstile inputs are excluded from visible field styling.

| Comparison | 1280 px | 375 px |
|---|---|---|
| Newsletter row | [live vs local](compare-labels-newsletter-row-w1280.png) | [live vs local](compare-labels-newsletter-row-w375.png) |
| Newsletter section | [live vs local](compare-labels-newsletter-section-w1280.png) | [live vs local](compare-labels-newsletter-section-w375.png) |
| Homepage contact form | [live vs local](compare-labels-contact-home-w1280.png) | [live vs local](compare-labels-contact-home-w375.png) |
| `/kontakt` form | [live vs local](compare-labels-contact-kontakt-w1280.png) | [live vs local](compare-labels-contact-kontakt-w375.png) |

[Chrome accessibility tree + field styles](labels-accessibility.json) records live/local names per field at both widths on both routes. Native CDP `Accessibility.getPartialAXTree` confirms all **24 local interactive controls** (16 text fields and 8 checkboxes across four route/width combinations) remain exposed and have accessible names exactly equal to associated label text. Every local text-field label is associated by for/id and clipped to 1×1px; checkbox labels are visible and associated by wrapping. There are **zero duplicate ids** on all local pages. Existing live duplicate ids and its unlabeled hidden newsletter checkbox are recorded as reference only; they were not copied.

Placeholder contrast on white: **local 5.398:1**, using the existing text-muted token; **live 3.382:1**. The slightly darker local colour is intentional to meet ≥4.5:1. [Capture/assertion driver](labels-proof.mjs) verifies these conditions, exact placeholder/required parity, contact dimensions/styles, retained newsletter alignment and no horizontal overflow. `labels_-w*.png` and `labels_kontakt-w*.png` are additional direct verify-web shots; [HTTP probes](labels-probes.tsv) return 200.

[Submission proof](labels-forms-proof.json), [mock payloads](labels-delivery.json) and [driver](labels-submission.mjs): browser fills by accessible name, posts through the real local Worker, receives 303 and reaches the correct thank-you path for landing contact, newsletter and full contact. Payloads remain 37/34/37 fields with all 32 attribution keys, newsletter=true. Turnstile issues test tokens at zero height; missing-token 403 and unknown-form error recovery still pass. No production submission or secret changes.

Validation: [Astro check](labels-astro-check.txt) passes (0 errors/warnings, existing hint only), [source tests](labels-source-tests.txt) pass (81 passed, one skipped, zero failed), [build](labels-build.txt) passes (117 pages). Requested literal [node --test src](labels-node-test-src.txt) still fails with MODULE_NOT_FOUND on Node 24; the full explicit source-file test invocation passes. No dedicated label/a11y test files exist in the repository; all existing source tests ran, supplemented by the native Chrome AX assertions above. [Design detector](labels-design-detector.json) reports only the previously approved newsletter gradient. Board: 31 tasks, 0 problems.

## Full-width contact submit

The shared LeadForm selector `data-form$="-contact"` applies full-width submit treatment to both contact contracts, `landing-contact` and `main-contact`. Newsletter does not match this selector and its inline row remains unchanged. This update changes only LeadForm.astro; ContactForm/card markup, layout and background CSS are untouched.

Measured live button treatment reproduced locally at 1280/375: **100% of the form column**, height **51px / 44px**, padding **8px 24px**, radius **50px**, Satoshi weight **400**, font size **20px / 16px**, line-height **35px / 28px**. Absolute widths follow each site's existing form column rather than imposing live's column width on the local card. [Computed button sizes](button-computed.json) includes form/button widths for both routes, newsletter geometry and the preserved local card background **rgb(249,250,251)**.

| Evidence | 1280 px | 375 px |
|---|---|---|
| Homepage contact section | [live vs local](compare-button-contact-home-w1280.png) | [live vs local](compare-button-contact-home-w375.png) |
| `/kontakt` section | [live vs local](compare-button-contact-kontakt-w1280.png) | [live vs local](compare-button-contact-kontakt-w375.png) |
| Newsletter row regression | [live vs local](compare-button-newsletter-row-w1280.png) | [live vs local](compare-button-newsletter-row-w375.png) |

[Proof driver](button-proof.mjs) asserts full form width on live/local, exact live height/padding/radius/font agreement, unchanged grey local card, no horizontal overflow and newsletter controls side by side, equal height, centre difference 0px. `button_-w*.png` and `button_kontakt-w*.png` are direct verify-web shots; [HTTP probes](button-probes.tsv) return 200.

[Submission results](button-forms-proof.json), [mock receiver payloads](button-delivery.json), [submission driver](button-submission.mjs): landing contact/newsletter/full contact continue to return 303 and navigate to the correct thank-you pages. Payloads retain 37/34/37 fields and all attribution keys. Missing-token protection and unknown-form recovery pass.

[Astro check](button-astro-check.txt) passes with 0 errors/warnings and one existing hint; [source tests](button-source-tests.txt): 81 passed, one skipped, zero failures; [build](button-build.txt): 117 pages. The requested literal [node --test src](button-node-test-src.txt) still fails on this Node 24 directory invocation; explicit source-file discovery runs the complete passing suite. Board check: 31 tasks, 0 problems. Design detector on LeadForm reported no findings. No deploy or merge.

## Centred header, form heading and profile photo

Final scope for PR #50: exactly these three ContactForm refinements plus the requested PR-link attempt. `link_pull_request` succeeded (`alreadyLinked: true`). No other application file changed in this update.

1. Landing section header is centred with a 600px maximum width (343px at 375 viewport), centred text and 25px/20px child gaps. Header-to-card spacing is 48px desktop / 32px mobile, matching live. Full contact retains its existing H1/header composition because live `/kontakt` uses a different, left-aligned full variant.
2. Landing adds **H3 Formularz kontaktowy** above the fields inside the card, below the section H2. It matches live's 30px/24px, weight 600, line-height 37.5px/30px and approximately 24px actual heading-to-input spacing. If a landing block has no section heading it falls back to H2 to avoid a skipped level. Full contact already has its page H1 and a Formularz kontaktowy tagline in content; live has no extra form H3, so no duplicate heading is added.
3. Landing portrait matches live's rendered **168.953×168.953px at 1280** and **59×59px at 375**, radius 0 and 24px gap before Bezpośredni kontakt. After decoding the live lazy image, the actual desktop rule is 33% of its 512px column; mobile is 20% of 295px. Local fluid photo dimensions reproduce these endpoints without changing the existing card columns. Live/full contact has no corresponding portrait, and none is inserted into the full variant.

| Contact section | 1280 px | 375 px |
|---|---|---|
| Homepage | [live vs local](compare-section-contact-home-w1280.png) | [live vs local](compare-section-contact-home-w375.png) |
| `/kontakt` | [live vs local](compare-section-contact-kontakt-w1280.png) | [live vs local](compare-section-contact-kontakt-w375.png) |

[Computed sizes and heading outline](section-computed.json) records live/local geometry, spacing, typography, photo dimensions, card background, phone text and link underlines. [Proof driver](section-proof.mjs) asserts landing parity to subpixel tolerance, H2→H3 structure, no duplicate full-variant H1/form heading or portrait, and no horizontal overflow. Direct verify-web `section_-w*.png` and `section_kontakt-w*.png` and [HTTP probes](section-probes.tsv) supplement the cropped comparisons.

Phone number rendering, link markup/underlines and the light grey card background were left untouched. LeadForm, fields, buttons, newsletter, footer and other blocks were not modified.

[Submission proof](section-forms-proof.json), [mock receiver payloads](section-delivery.json), [submission driver](section-submission.mjs): landing contact, newsletter and full contact still return 303 and navigate to the correct thank-you paths, with unchanged 37/34/37-field payloads and attribution contract. Missing-token 403 and unknown-form recovery still pass.

[Astro check](section-astro-check.txt) passes (0 errors/warnings, one existing hint), [source tests](section-source-tests.txt) pass (81 passed, one skipped, zero failed), [build](section-build.txt) passes (117 pages), and board check passes (31 tasks, 0 problems). The requested literal [node --test src](section-node-test-src.txt) was also run; this Node 24 invocation rejects the directory, while explicit source-file discovery passes the complete suite. [Design detector](section-design-detector.json): no findings.

Other observed differences are follow-ups for a **new task and PR**: existing card column proportions/padding; main heading/tagline typography and outer section rhythm from global fluid tokens; full contact's existing H1/tagline/intro placement relative to the live form column. Phone formatting and link underlines remain explicitly protected. These differences were not changed here.
