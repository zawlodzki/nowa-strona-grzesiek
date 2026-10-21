# Design audit of zawlodzki.pl (T03)

Live site, captured 2026-10-21. Scope is refine, not redesign (`migration/PLAN.md`, section 10). Product context is in `/PRODUCT.md`.

## Method

- Pages: `/` (home), `/szkolenie-i-wdrozenie-pipedrive` (pipedrive), `/wdrozenie-ai-w-sprzedazy-b2b` (ai-b2b), `/sales-atlas-system` (sales-atlas), `/blog` (blog), `/blog/salesforce-cena` (blog-salesforce-cena). Marketing pages are Persuade surfaces. The blog and the post are Read surfaces.
- Viewports: desktop 1440x900 and mobile 390x844 (2x, touch emulation).
- Screenshots: `screens/<slug>-<desktop|m390>-<fold|full>`. The fold images are PNG, the full pages JPG. Rerun with `node migration/lanes/design/out/screens/capture.mjs`. The c15t banner is left in the captures because a first-time visitor sees it.
- Method: dual-agent, as impeccable `critique` requires. Assessment A was a design review from screenshots and the HTML snapshots. Assessment B ran `impeccable detect` against each URL at both viewports (12 runs) plus a technical audit of the HTML, CSS and headless-Chrome measurements. The two did not see each other's output. The coordinator spot-checked the key evidence in `migration/00-inventory/live-site/html/`.
- Not done: the `live-server` overlay injection, and real touch gestures. Layout was checked under emulated touch in Chromium only.

## Scores

### Critique (Nielsen, 0 to 4)

| # | Heuristic | Marketing | Blog |
|---|---|---|---|
| 1 | Visibility of system status | 2 | 3 |
| 2 | Match with the real world | 3 | 4 |
| 3 | User control and freedom | 3 | 3 |
| 4 | Consistency and standards | 2 | 3 |
| 5 | Error prevention | 2 | n/a |
| 6 | Recognition over recall | 3 | 2 |
| 7 | Flexibility and efficiency | 2 | 2 |
| 8 | Aesthetic and minimalist design | 2 | 3 |
| 9 | Error recovery | n/a | n/a |
| 10 | Help and documentation | 3 | 3 |
| | **Total** | **22/36, Acceptable** | **23/32, Good** |

Cognitive load is high on the marketing pages, which fail 4 of 8 checks (single focus, chunking, minimal choices, working memory). It is low to moderate on the blog.

### Technical audit (0 to 4)

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 2 | FAQ accordions can't be used from the keyboard. Fields are labelled only by placeholders. Eyebrow text fails contrast site-wide. |
| 2 | Performance | 2 | Desktop is fast (Lighthouse 0.99). The blog index ships 7.3 MB of eager PNG thumbnails. Fonts are TTF. An icon font is loaded for about 7 glyphs. |
| 3 | Theming | 2 | A 70-variable token ramp exists, but every animation embed copies the palette as literal hex. Text and decorative tokens are mixed. |
| 4 | Responsive | 3 | No horizontal overflow at 390. Scene labels shrink to about 5px, the root font-size is in px, and many targets are under 44px. |
| 5 | Implementation integrity | 2 | All social links are named "Twitter". Icon ligature words leak into link names. Template comments and a vendor-hosted script ship in production. |
| | **Total** | **11/20, Acceptable** | |

Detector: 323 hits across 12 runs. About 20 are false positives or sit in decorative `aria-hidden` scenes. The main rules are low-contrast (188), gradient-text (48), straggler and unbalanced-heading (advisory), ai-color-palette (24), bounce-easing (12), nested-cards, side-tab and line-length. Full table in the appendix.

## Design specificity verdict

The site is partly specific. Three things belong to this product:

- the "GZ" monogram behind the portrait on the home hero;
- the product scenes: the Pipedrive pipeline with the "Acme €24,000" deal, the "Sales Agent" panel, the automation flow and the nine-layer Sales Atlas stack;
- first-person copy that names real manual work ("Aplikacje nie współpracują, więc handlowiec robi za integrację").

Everything around them is a Webflow SaaS template. The repeated parts are:

- eyebrow, heading and paragraph sections, about 12 per page;
- gradient keyword highlights in headings;
- a 24-logo wall;
- count-up stat cards;
- a three-card pricing grid;
- a CTA band;
- a dark newsletter band.

A refine should strengthen the three specific parts and quiet the template parts.

## What works (keep it through the migration)

1. **The problem-first voice.** The home "Problem" section and the Pipedrive "Konto w Pipedrive można skonfigurować w tydzień. Problem zaczyna się później." section are the strongest persuasion on the site. Migrate the copy verbatim.
2. **Transparent pricing.** Pipedrive and AI give net PLN prices with durations, totals and a market anchor. That qualifies buyers before the call.
3. **The blog post as a Read surface.** It leads with the answer and numbers, dates its sources, uses real tables, a sticky TOC on native `<details>` and an on-brand chart, and closes with a soft, relevant CTA.
4. **Responsible scenes.** Every animation is `aria-hidden`, and each honours `prefers-reduced-motion` with a resolved end state, not a global kill.
5. **Solid basics.** One `h1` per page, no heading skips, `lang="pl-PL"`, no missing alt attributes, no horizontal overflow at 390, and 44px inputs at 16px.

## Ranked findings

Severity follows impeccable: P0 blocks the task, P1 is a major problem or a WCAG A/AA failure, P2 is a minor problem, P3 is polish. Findings are ranked by their impact on booking the consultation (Persuade) and on reading (Read). "Source" says which assessment raised it: A (design), B (technical), or both.

**1. [P1] The cookie banner covers the hero on every page**
- Pages: all six. Viewport: both.
- Screenshots: `home-m390-fold.png`, `home-desktop-fold.png`, `pipedrive-m390-fold.png`, `blog-salesforce-cena-m390-fold.png`.
- The c15t modal is about 680x430px on desktop and covers the subhead and the CTA. At 390 it covers the H1, the subhead and the CTA. On the home mobile fold the visitor sees a promo bar, the logo, the portrait, the eyebrow and nine lines of consent text, and no value proposition.
- Fix: keep the c15t loader and its behaviour, and restyle the banner. On mobile, a compact bottom sheet of about 140px: two lines of text, a "Szczegóły" link, and three buttons of equal weight. On desktop, a corner box no wider than 400px that stays clear of the hero copy.
- Commands: `adapt`, `quieter`. Source: A.

**2. [P1] The mobile hero pushes the H1 and the CTA below the fold**
- Pages: home, pipedrive, ai-b2b, sales-atlas. Viewport: 390.
- Screenshots: `home-m390-fold.png`, `pipedrive-m390-fold.png`, `ai-b2b-m390-full.jpg`.
- The stack order is portrait, eyebrow, H1. Even without the banner, the H1 starts at about y=410 of 844 and the CTA sits below the fold. The Pipedrive and AI heroes also centre three paragraphs of body text.
- Fix: put the H1 first on narrow containers and make the portrait smaller (or move it after the subhead). Keep the CTA in the first viewport, left-align the body text, and cut the hero to one paragraph.
- Commands: `adapt`, `layout`, `typeset`. Source: A.

**3. [P1] The promo bar announces an expired offer**
- Pages: all six. Viewport: both, two lines (about 120px) at 390.
- Screenshots: `home-desktop-fold.png`, `home-m390-fold.png`.
- "Przedsprzedaż kursu AI w sprzedaży: -50% do 1 października →" is still live on 21 October. An expired offer at the top tells a B2B buyer the site isn't maintained.
- Fix: model the announcement as a Sanity document with an end date that hides it automatically, one line on mobile. Remove it on the live site now (the user's call, since Webflow is read-only for agents).
- Commands: `harden`, `clarify`. Source: A.

**4. [P1] The consultation CTA has six labels, one destination and no booking step**
- Pages: home, pipedrive, ai-b2b. Viewport: both.
- Screenshots: `home-desktop-full.jpg`, `pipedrive-desktop-full.jpg`, `ai-b2b-desktop-full.jpg`.
- All of these go to `/kontakt`: "Bezpłatna konsultacja", "Umów bezpłatną konsultację", "Porozmawiajmy o współpracy", "Umów rozmowę o wdrożeniu", "Porozmawiajmy o waszym procesie", "Sprawdźmy to na rozmowie".
- None of the four marketing pages links to cal.com (checked: 0 occurrences). Only `/kontakt` does, although the booked 25-minute call is the success event in PRODUCT.md.
- Nothing near the form says what happens next: the call is 25 minutes, online, with Grzegorz himself.
- Fix: use one primary label site-wide that includes the length of the call. Send it to the booking step, or to the form anchor on pages that already have a form. Add one reassurance line next to the form, using the real response time; don't invent one.
- Commands: `clarify`, `onboard`. Source: A.

**5. [P1] Typo in the Pipedrive trust line**
- Pages: pipedrive (plus small errors on other pages). Viewport: both.
- Screenshots: `pipedrive-m390-full.jpg` (hero paragraph). On desktop the same line sits under the banner in `pipedrive-desktop-fold.png`.
- The trust line right above the CTA reads "Mam oświadczenie z 50+ firm…". It should say "doświadczenie" (verified in the HTML).
- Other errors:
  - "rozwojem systememu" in pipedrive Krok 5;
  - "Oferta powstaje 3 godziny" on ai-b2b, missing "w";
  - missing commas in "Firmy które korzystają…", which appears on all pages, and in "Etap który…".
- Fix: correct them, and proofread all block content in Polish during the import (T15, T16).
- Command: `clarify`. Source: A.

**6. [P1] Stat cards render as zeros and count trivial things**
- Pages: pipedrive, ai-b2b. Viewport: both.
- Screenshots: `pipedrive-desktop-full.jpg` (section "Po wdrożeniu Pipedrive zostaje u Was"), `ai-b2b-desktop-full.jpg` (section "Po 12 tygodniach zostaje u was").
- The cards show "0+ Proces sprzedaży", "0 Przeszkolony administrator", "0 Dane dla AI" and "0 Baza wiedzy firmy". The count-up starts at 0, so any render the observer doesn't trigger shows zero.
- The count-up loads, render-blocking, from `systemflowco.github.io` (see finding 17). Even when it finishes, "1 administrator" is not a metric. This breaks the PRODUCT.md principle that every claim rests on something real.
- Fix: replace the row with a list of deliverables, written as nouns with no numerals ("Przeszkolony administrator i instrukcje"), and drop the count-up.
- Commands: `distill`, `quieter`. Source: A, B.

**7. [P1] FAQ accordions can't be used from the keyboard**
- Pages: pipedrive (11 items), ai-b2b (10), sales-atlas (6). Viewport: both.
- Screenshots: `pipedrive-desktop-full.jpg`, `ai-b2b-desktop-full.jpg`, `sales-atlas-desktop-full.jpg` (FAQ sections).
- The items are `div.collapse-trigger` elements with no `tabindex`, no role and no `aria-expanded`. The answers hold pricing details. This fails WCAG 2.1.1 and 4.1.2 (A).
- Fix: build the `faq` block on `<details>/<summary>`, the pattern the blog TOC already uses.
- Command: `harden`. Source: B.

**8. [P1] Form fields are labelled only by placeholders, and the placeholders fail contrast**
- Pages: home, pipedrive, ai-b2b (contact form); blog, blog-salesforce-cena (newsletter). Viewport: both.
- Screenshots: `home-m390-full.jpg` (contact form), `blog-desktop-full.jpg` (newsletter).
- The fields are "E-mail", "Telefon" and "Temat rozmowy" with no `<label>` and no `autocomplete`. Placeholder text is #838d95 on white, 3.4:1. Required fields carry no marker.
- On home, `id="newsletter"` appears twice. The 32 hidden fields share `id="field-4"`.
- This fails WCAG 1.3.1, 3.3.2, 1.3.5 and 1.4.3.
- Fix: visible labels, `autocomplete="email"` and `"tel"`, a required marker and unique ids. Keep the 32 attribution fields and Turnstile (AGENTS.md, T14).
- Command: `harden`. Source: A, B.

**9. [P1] The Sales Atlas page has no CTA button**
- Pages: sales-atlas. Viewport: both.
- Screenshots: `sales-atlas-desktop-full.jpg`, `sales-atlas-m390-full.jpg`.
- The hero has no button. The only CTAs are text links inside the tab panels. The page ends with the FAQ and then the footer, with no closing band and no form, although every service page links to it.
- Fix: add one hero button, plus the standard closing `ctaBand` and the `contactForm` before the footer.
- Command: `layout`. Source: A.

**10. [P1] Eyebrow and tagline text fails contrast site-wide**
- Pages: all six. Viewport: both.
- Screenshots: `home-desktop-fold.png` ("WDROŻENIA CRM, AUTOMATYZACJI I AI W SPRZEDAŻY B2B"), `home-m390-fold.png`, `blog-salesforce-cena-desktop-fold.png` (TOC).
- `.tagline` uses `--neutral--70` (#838d95): 3.38:1 on white, 3.2:1 on #f9fafb. That accounts for 49 detector hits on desktop. The blog TOC uses the same colour. This fails WCAG 1.4.3.
- Fix: in the token contract (T04), text roles use `--neutral--80` (#636b75, 5.4:1), and `--neutral--70` stays non-text only.
- Commands: `colorize`, `typeset`. Source: B.

**11. [P1] Cyan gradient text and cyan tags fall below 3:1**
- Pages: pipedrive (10 headings), ai-b2b (7), home (5). Viewport: both.
- Screenshots: `ai-b2b-desktop-full.jpg` ("Pierwszy agent AI"), `pipedrive-desktop-full.jpg` (the "WDROŻENIE 5+ HANDLOWCÓW" tag).
- `.c-t-gradient-primary` is a blue-to-cyan gradient clipped to text. It ends at #0acffe, which is 1.85:1 on white. The pricing tag is #0acffe on #e7faff, 1.72:1. Both fail WCAG 1.4.3 even for large text.
- Fix: drop gradient-clipped text. Mark the keyword with weight or solid primary blue. Tags use #06687f on #e7faff (5.9:1).
- Command: `colorize`. Source: B (the detector missed the contrast, a false negative).

**12. [P1] Links in the dark band are 2.59:1**
- Pages: home, blog, blog-salesforce-cena (every page with the newsletter band). Viewport: both.
- Screenshots: `blog-desktop-full.jpg`, `home-desktop-full.jpg` (newsletter band).
- "Regulamin newslettera" and "Polityka prywatności" are #3a48cc on #0b0a47. The visitor agrees to these terms and can barely read them.
- Fix: an on-dark link token (`--primary--20`, 9.35:1), keeping the underline.
- Command: `colorize`. Source: B.

**13. [P1] Icon-font ligature words leak into accessible names; social links are all "Twitter"**
- Pages: all six. Viewport: both.
- Screenshots: `home-desktop-full.jpg` (footer icons and the arrow CTAs). The defect is in the markup; once the font has loaded the icons look correct.
- Material Icons are text ligatures with no `aria-hidden`, so link names come out as "Porozmawiajmy o współpracyarrow_forward" and "phone+48…". pipedrive announces "check" 31 times.
- The GitHub, LinkedIn and X links in the footer all carry `aria-label="Twitter"` (verified in the HTML).
- This fails WCAG 2.5.3, 2.4.4 and 4.1.2.
- Fix: inline SVG icons with `aria-hidden="true"`, and social link names taken from data in the footer component.
- Commands: `harden`, `optimize`. Source: B.

**14. [P1] Focus indicators removed with no replacement**
- Pages: all six. Viewport: both.
- Screenshots: `sales-atlas-desktop-full.jpg` (vertical tabs), `home-m390-fold.png` (hamburger).
- The Webflow CSS sets `outline:0` on `.w-nav-button`, `.w-tab-link`, `.w-dropdown-toggle` and `.w-input`. There is no `:focus-visible` rule anywhere. Buttons do have a ring. This fails WCAG 2.4.7.
- Fix: one global `:focus-visible` ring built from tokens, in the CSS foundation (T08).
- Command: `harden`. Source: B.

**15. [P2] Claims contradict each other**
- Pages: sales-atlas, pipedrive, ai-b2b. Viewport: both.
- Screenshots: `sales-atlas-desktop-full.jpg`, `pipedrive-desktop-full.jpg`, `ai-b2b-desktop-full.jpg`.
- Sales Atlas says the system is for B2B companies "do 250 osób" (meta description and copy), but every logo section says "od 2 do 500 pracowników".
- The tier "WDROŻENIE 5+ HANDLOWCÓW" lists "Zakres pakietu do 5 osób". The tier "DLA FIRMY PRODUKCYJNEJ" lists "Zakres dla firmy usługowej".
- "Od czego zacząć" names "Audyt CRM Pipedrive" but links to "Zobacz audyt sprzedaży".
- Fix: the user decides which employee range is true. Reword the tiers as "Wszystko z pakietu …, plus:", and make the audit label match its link.
- Command: `clarify`. Source: A.

**16. [P2] The blog index is a wall of identical thumbnails and heavy images**
- Pages: blog. Viewport: both.
- Screenshots: `blog-desktop-full.jpg`, `blog-m390-full.jpg`.
- Every card uses the same portrait on blue with a two-word overlay, and has no date, category or excerpt. About 80 posts are reachable only through "Następne wpisy". "Blog" is not in the main nav.
- The images are 556 KB PNGs, 15 of them eager, with no `srcset`: 7.3 MB on the index. Each card's alt repeats its title inside the same link, so the name is announced twice.
- Fix: text-led cards with category, date and a one-line excerpt. Add up to five category filters, and put Blog in the nav. Use responsive, lazy AVIF or WebP crops with `alt=""`.
- Commands: `layout`, `distill`, `optimize`. Source: A, B.

**17. [P2] Performance debt in the shared shell**
- Pages: all six. Viewport: both.
- Screenshots: `pipedrive-desktop-full.jpg` (the stat cards driven by the countup script), `blog-salesforce-cena-desktop-full.jpg` (the related-post PNGs). The rest is visible only in the network log.
- The fonts are Satoshi and Erode, shipped as TTF (124 KB and 114 KB), with italic faces declared as well. The 125 KB Material Icons woff2 draws about 7 glyphs. jQuery and the Webflow bundles add about 317 KB.
- On pipedrive and ai-b2b, `countup-min.js` loads render-blocking from the template vendor's GitHub Pages, with no SRI.
- The post loads three related-post PNGs eagerly, 2.5 MB.
- Fix: subset woff2 fonts with the two upright faces preloaded, SVG icons, no jQuery, no third-party countup.
- Command: `optimize`. Source: B.

**18. [P2] Mobile tables in the post clip the key column**
- Pages: blog-salesforce-cena. Viewport: 390.
- Screenshots: `blog-salesforce-cena-m390-full.jpg`.
- The price table drops its "10 osób rocznie" column, the number the reader came for. "Co jest w cenie licencji" cuts the Pro Suite column mid-word. Nothing shows that the table scrolls.
- Fix: a table wrapper in an inline-size container with a visible overflow cue, or rows stacked as cards in narrow containers.
- Command: `adapt`. Source: A.

**19. [P2] Vendor wordmarks cut off behind the portrait**
- Pages: pipedrive, ai-b2b. Viewport: both.
- Screenshots: `pipedrive-desktop-fold.png`, `ai-b2b-desktop-fold.png`.
- The hero art reads "pipe[head]rive", "ANT[head]OPIC" and "O[head]AI". It borrows other brands as the hero and looks like an accidental crop. On ai-b2b the same logos repeat in the tools strip just below.
- Fix: reuse the GZ monogram treatment from home. Move the Pipedrive Authorized Partner badge, a real credential, next to the hero CTA.
- Commands: `quieter`, `layout`. Source: A.

**20. [P2] The logo wall is undifferentiated and long on mobile**
- Pages: home, pipedrive, ai-b2b. Viewport: both.
- Screenshots: `home-desktop-full.jpg`, `home-m390-full.jpg`.
- 24 logos with uneven optical weight fill about a full screen at 390, pushing the problem statement down. IAB, the named reference in PRODUCT.md, has the same weight as the rest.
- Fix: 8 to 12 logos at a normalized height in one tone, IAB first, two rows on mobile.
- Commands: `distill`, `polish`. Source: A.

**21. [P2] Scene labels shrink to about 5px on mobile, and use English**
- Pages: home, pipedrive, ai-b2b. Viewport: 390 (language on both).
- Screenshots: `home-m390-full.jpg` (the EMAIL, PRICEBOOK, CRM and AI labels), `ai-b2b-desktop-full.jpg`.
- The scenes scale a 760px canvas by about 0.47, so 12px labels render at about 5.6px.
- On a Polish page the labels are English: "Perceived speed", "Researched 12 leads", "Ask your agent…", "APPROVED".
- The ai-b2b week ranges overlap (1-2, 2-4, 3-5, 5-9, 6-12).
- Fix: a reflowed mobile layout for each scene (T11) with a 12px rendered floor, Polish strings, and sequential phases or one labelled timeline.
- Commands: `adapt`, `clarify`. Source: A, B.

**22. [P2] The strongest proof is buried**
- Pages: pipedrive, ai-b2b, sales-atlas. Viewport: desktop.
- Screenshots: `pipedrive-desktop-full.jpg`, `ai-b2b-desktop-full.jpg`.
- The only concrete client outcome on the site ("z 5 dni do 2 godzin" on lead response time, a tax advisory client) sits in body text below pricing. ai-b2b and sales-atlas have no client testimonial.
- Fix: promote the existing outcome into a proof block next to pricing. Leave a slot on ai-b2b for a real testimonial; don't invent one.
- Commands: `layout`, `clarify`. Source: A.

**23. [P2] Service links on home look external; off-topic related posts on the blog**
- Pages: home, blog-salesforce-cena. Viewport: both.
- Screenshots: `home-desktop-full.jpg`, `blog-salesforce-cena-desktop-full.jpg`.
- "Dowiedz się więcej o pipedrive.com →" goes to his own service page, but reads like a vendor link.
- Under the Salesforce price post, "Powiązane wpisy" shows three Asana comparisons, although Salesforce posts exist.
- Fix: label the links by service ("Wdrożenie Pipedrive →"). Pick related posts by shared tag in Sanity (T07, T18).
- Commands: `clarify`, `harden`. Source: A.

**24. [P2] Typography: px root, no wrap control, long measure**
- Pages: all six. Viewport: both.
- Screenshots: `sales-atlas-desktop-full.jpg` (lines of about 137 characters), `blog-salesforce-cena-desktop-full.jpg` (about 90 characters).
- `html { font-size: 20px }`, falling to 16px below 991px, ignores the user's font setting.
- No `text-wrap` rule exists, which explains all the straggler and unbalanced-heading advisories.
- Fix: a `%` or `rem` root with fluid `clamp()` type, `text-wrap: balance` on headings and `pretty` on body text, and a measure cap of about 70ch.
- Command: `typeset`. Source: B.

**25. [P2] No `<main>` landmark and no skip link; tap targets under 44px**
- Pages: all six. Viewport: both (targets at 390).
- Screenshots: `home-m390-full.jpg` (the "Dowiedz się więcej" links are 28px tall), `blog-salesforce-cena-m390-fold.png` (the TOC summary is 19px tall).
- Each page has zero `main`, zero `header` and no skip link, with a promo bar and six nav items before the content. Each page has 8 to 15 targets under 44px.
- Fix: a layout shell with `header`, `main` and `footer` plus a "Przejdź do treści" link, and `min-block-size: 44px` on standalone links and summaries.
- Commands: `harden`, `adapt`. Source: B.

**26. [P3] Template residue in production markup and in the palette**
- Pages: home, pipedrive, ai-b2b. Viewport: both.
- Screenshots: `home-desktop-full.jpg` (the scenes whose markup carries the comments and literal palette). The defect is in the code.
- Home ships 42 HTML comments, including "Replace this demo scene with your product metaphor". Each scene redeclares the palette as literal hex, 45 distinct values including off-scale ones. `will-change` stays on after the scenes finish. Sales Atlas animates `max-height`.
- Fix: the Astro build strips comments. Scenes consume `contracts/tokens.json`. `will-change` is set only during playback, and the max-height transition becomes `grid-template-rows`.
- Commands: `distill`, `document`, `animate`. Source: B.

**27. [P3] Empty right halves next to section intros on desktop**
- Pages: home, pipedrive, ai-b2b, sales-atlas. Viewport: desktop.
- Screenshots: `home-desktop-full.jpg`, `pipedrive-desktop-full.jpg`, `sales-atlas-desktop-full.jpg`.
- Intros such as "Zacznijmy od miejsca, które dziś najbardziej blokuje pracę zespołu" and "Czym Sales Atlas System nie jest" fill the left half and leave the right half blank.
- Fix: a single narrow measure for intro-only sections, or a paired scene.
- Command: `layout`. Source: A.

## Systemic patterns

- **Template parts and the parts that are his own are not separated.** The scenes, the voice and the monogram are the brand. The logo wall, the count-up stats, the gradient highlights and the vendor wordmarks are template residue. The block contract should make the first group easy and leave the second group out.
- **Text and decorative colour tokens are mixed.** That causes most contrast failures (findings 10, 11, 12). T04 should define text roles that pass 4.5:1 by construction.
- **Webflow widgets ship without accessibility work.** Div accordions, `outline:0`, placeholder-only inputs and an icon font used as content. Each block component should use native elements (findings 7, 8, 13, 14).
- **Conversion has no single path.** Six CTA labels, no booking link, a page with no CTA, and a consent banner over the hero (findings 1, 4, 9).
- **Content errors live in the CMS.** Typos, contradictions and an expired banner (findings 3, 5, 15). The importer is the cheapest place to fix them, with a proofreading pass and an `endDate` on announcements.

## Recommended next steps (for the follow-up tasks)

1. `harden` in T09/T10 block components: native FAQ, labelled forms, SVG icons, `:focus-visible`, a landmark shell.
2. `colorize` and `typeset` in T04/T08: text-safe tokens, no gradient text, a rem root, fluid type, wrap rules.
3. `clarify` in T15/T16 import: typos, contradictions, one CTA label, Polish scene strings. Decisions for the user: the true employee range, and whether the CTA goes straight to cal.com.
4. `adapt` and `layout`: mobile hero order, compact consent banner styling, mobile scenes (T11), post tables.
5. `optimize`: woff2 fonts, no icon font, no jQuery, no countup, responsive blog images.
6. `polish` as the final pass on staging (gate G3).

## Appendix: detector runs

`impeccable detect --json <url>` at the default desktop viewport and with `--viewport 390x844`. All 12 runs exit 2 (findings).

| page / viewport | low-contrast | straggler | unbalanced-heading | gradient-text | ai-color-palette | bounce-easing | nested-cards | side-tab | line-length | total |
|---|---|---|---|---|---|---|---|---|---|---|
| home / desktop | 25 | 1 | 2 | 5 | 2 | 1 | 1 | 2 | 0 | 39 |
| home / 390 | 21 | 2 | 1 | 5 | 2 | 1 | 1 | 2 | 0 | 35 |
| pipedrive / desktop | 28 | 1 | 3 | 10 | 4 | 1 | 0 | 2 | 1 | 50 |
| pipedrive / 390 | 26 | 2 | 0 | 10 | 0 | 1 | 0 | 2 | 0 | 41 |
| ai-b2b / desktop | 21 | 2 | 1 | 7 | 4 | 1 | 0 | 0 | 0 | 36 |
| ai-b2b / 390 | 21 | 4 | 0 | 7 | 4 | 1 | 0 | 0 | 0 | 37 |
| sales-atlas / desktop | 7 | 1 | 1 | 0 | 2 | 1 | 2 | 0 | 2 | 16 |
| sales-atlas / 390 | 6 | 1 | 2 | 0 | 0 | 1 | 2 | 0 | 0 | 12 |
| blog / desktop | 2 | 0 | 2 | 1 | 2 | 1 | 0 | 0 | 0 | 8 |
| blog / 390 | 2 | 1 | 3 | 1 | 2 | 1 | 0 | 0 | 0 | 10 |
| blog-salesforce-cena / desktop | 5 | 1 | 3 | 1 | 0 | 1 | 0 | 0 | 9 | 20 |
| blog-salesforce-cena / 390 | 4 | 9 | 2 | 1 | 2 | 1 | 0 | 0 | 0 | 19 |

Verification against the HTML and CSS:

- **low-contrast.** Mostly real (taglines, placeholders, dark-band links, cyan tags, the TOC). About 15 hits sit inside decorative `aria-hidden` scenes.
- **gradient-text.** Real. Its contrast failure was missed by the detector (finding 11).
- **ai-color-palette.** This is the conic cyan glow on the Sales Atlas badge, in brand cyan. Whether it reads as an "AI glow" is a judgment call.
- **bounce-easing.** Real, but the hit is on the c15t consent root, which stays as it is. The same curve in the scene scripts was not flagged.
- **nested-cards.** False positive on home (a chat bubble inside the chat scene). Real on sales-atlas (boxes inside the tab panel).
- **side-tab.** Real, but low severity: deal-card stripes inside the scenes, and the Sales Atlas vertical tabs.
- **line-length.** Real (finding 24).
- **straggler and unbalanced-heading.** Advisory and real. No `text-wrap` rule exists.
