# Block refine notes (T04)

For each of the 12 blocks in `migration/contracts/blocks.json`: where it appears, the current visual pattern, the refine changes, and whether the design fits the block's fields. Token names refer to `DESIGN.md` and `tokens.json` in this folder. Audit numbers refer to `audit.md` (T03).

Sources: the live HTML snapshot (`migration/00-inventory/live-site/html/`, 106 pages), `webflow/components.json` section trees, the compiled Webflow CSS, and the T03 screenshots. Each misfit names the live content that does not fit, so the blocks.json owner can decide. This file changes no contract.

Shared refine for every block:
- Taglines use the Label role in Slate (audit 10).
- Headings get `text-wrap: balance`, with no gradient-clipped keywords (audit 11, 24).
- Icons are inline SVG with `aria-hidden` (audit 13).
- Boxed surfaces use `radius.lg`, parts inside them use `radius.sm`.
- Standalone links and summaries are at least 44px tall (audit 25).
- The section rhythm is `layout.section-y`.

## 1. hero

**Where.** "hero zawlodzki" on 12 pages (/, service, audit and AI pages, /kurs-ai-w-sprzedazy). "Hero zawlodzki badge" on /sales-atlas-system and /szkolenie-i-wdrozenie-salesforce. A plain Hero Section on /wspolpraca and /program-partnerski.

**Current.**
- `hero-grid-2` is 1.5fr text and 1fr image, with a 48px gap.
- The text stack is tagline, Display H1, body, then the primary pill.
- The image is one flattened bitmap: the portrait plus the GZ monogram on home, or cropped vendor wordmarks on the service pages.
- The badge variant overlaps a second image (the Sales Atlas badge or the Salesforce logo) at bottom left.
- At 390 the stack is image first, then centred text, so the H1 lands at about y=410 and the CTA falls below the fold.

**Refine.**
- Below 768px, order the stack H1, body, CTA, then the portrait capped at about 40vh. Left-align the text at every width (audit 2).
- One body paragraph. The trust line ("Mam doświadczenie z 50+ firm…", typo fixed, audit 5) moves to Body S in Slate above the CTA.
- Render the monogram backdrop in code (Erode "GZ" in Atlas Blue) behind a cut-out portrait, on every page. This replaces the vendor wordmark crops (audit 19).
- The Pipedrive Authorized Partner badge sits beside the CTA where it applies.
- Every hero has a CTA, which defaults to the consultation link. /sales-atlas-system gets one (audit 9).

**Fit.** Partial.
- `badges: string[]` does not fit. The live badge is an image (`img.badge-naroznik`), not text. It needs `badgeImage: image` with alt text, or a `reference<logo>`.
- `image` alone cannot express a portrait over the monogram. Add `backdrop: 'monogram'|'none'`, or keep composites and give up the fix for audit 19.
- No field holds the trust line. Add `trustLine: string?`.
- The H1 on /o-mnie (inside a feature), /kontakt (inside the contact section) and /newsletter (none, the newsletter band opens the page) sits outside any hero. The page type should own the H1 there, or those pages get a hero.

## 2. logoStrip

**Where.**
- Clients ("zawlodzki loga wspolprace") on 14 pages: 24 logos in three rows of 8, the tagline "Z kim współpracuję", an H2, and the "od 2 do 500 pracowników" line.
- Tools ("zawlodzki loga aplikacji") on / and /automatyzacje-dla-pipedrive: 8 logos and a caption.
- The same tool strip without a component on the four AI pages.
- "zawlodzki narzędzia" on /wspolpraca: 3 logos.

**Current.**
- `testimonials-logos-grid` with 128px-tall cells and logos at 75% width, object-fit contain, in full brand colour, with uneven optical weight.
- A centred heading.
- At 390 it becomes 2 columns, and the client wall fills about a full screen.

**Refine.**
- Clients: 8 to 12 logos, IAB first.
- One normalized logo height (about 32–40px desktop, 28px mobile) instead of a 128px cell. One tone (Body Ink monochrome). At most two rows on mobile, in 3 or 4 columns (audit 20).
- Fix the comma in "Firmy, które korzystają" (audit 5).
- Tools: one row, caption above, no heading. Skip the strip on AI pages once the hero no longer repeats the same vendor marks.

**Fit.** Fits `variant`, `title` and `logos`. It is missing `tagline`, `caption` (the client range line, the tools sentence) and an explicit order. The match collides with testimonials: every logo strip renders as `div.testimonials-section`, so lane M must classify by inner `testimonials-logos-grid`.

## 3. feature

**Where.** 87 `feature-section` nodes on 16 pages:
- Problem;
- Krok 1–5, Tygodnie, Obszar 1–5, Moduł 1–8 and Bonus 1–2;
- the home anchors #crm, #ai, #automatyzacja and #asana;
- home O mnie, the /kurs-ai-w-sprzedazy author section, the /automatyzacja-procesow-biznesowych-nocode features;
- Sales Atlas "Dziewięć warstw" and "Kolejność".

**Current.**
- `feature-grid-2` is 1.5fr text and 1fr media, media on the right. `feature-grid-3` mirrors it. Steps alternate.
- Text: tagline, Headline, body paragraphs, then a primary pill (Problem) or an arrow text link (home).
- Media is a product scene (`#zw-*`, 52 distinct ids), a static image, or a "Co dostajesz" checklist (kurs).
- No surface, border or shadow.
- At 390 the text comes first, and scenes scale to about 0.47, so labels shrink to about 5.6px.

**Refine.**
- Keep the alternation and the 1.5:1 ratio. Cap body text at 65ch.
- No gradient keywords. Use solid Atlas Blue or weight.
- Text-only features (no media) render as a single column at the narrow measure (audit 27).
- Steps in one sequence get a tighter rhythm between them than between unrelated sections, so they read as one group.
- Links are labelled by service ("Wdrożenie Pipedrive →", audit 23) and are 44px tall.
- Scenes (T11): token colours, Polish strings, sequential week ranges, a reflowed mobile layout with a 12px label floor (audit 21, 26).

**Fit.** Partial.
- No `headingLevel`. Problem is H2, while Krok and Moduł are H3 under a contentSection intro.
- No `media.caption`. ai-b2b cites McKinsey under the scene.
- No `cta.style: 'button'|'link'`.
- Kurs Moduł and Bonus put a titled checklist in the media column. It needs `media.kind: 'checklist'` with `title` and `items`.
- `DiagramKey` lists 11 keys, but the live site has 52 scene ids (some reused across pages with identical code). Contract request for the diagram owner.
- The `Feature Section` match also catches the Sales Atlas promo band (`feature-section c-b-gradient-dark`, 10 pages). promoCard must win.

## 4. contentSection

**Where.** About 54 `section` nodes on 21 pages:
- Dla kogo;
- the Jak pracuję, Program and Zakres intros;
- Efekty and Co dostajesz (count-up stats, 9 pages);
- home Współpraca and Moje usługi;
- Następny etap and Po audycie (body plus link rows);
- Sales Atlas Granice, Test and Pochodzenie;
- /wspolpraca steps;
- /darmowe-materialy-dla-biznesow-uslugowych cards.

**Current.**
- Two alignments. Centred (Dla kogo, Efekty), or left with a 50%-wide title.
- Lists use a Material Icons "check" in Atlas Blue or "close" in red.
- Stat cards are 4 Mist cards with a big Atlas Blue count-up number that renders "0" before it runs (audit 6).
- Link rows are inline text links with 28px targets.
- At 390 everything stacks.

**Refine.**
- Left alignment by default on Persuade pages. Centre only the pricing header.
- Intro-only sections become a single column at about 40rem (audit 27).
- Replace stat cards with a deliverables list of nouns without numerals, in `cards` or `checklist` (audit 6).
- SVG ✓ and ✕ icons. ✕ items use Error Red marks with Body Ink text.
- Link rows become 44px arrow links with service names.
- Sales Atlas copy changes "250" to "500" (audit 15, user decision).

**Fit.** Poor. This is the most overloaded block.
- Fit lists (kurs, program-ai, audyt-ai): a ✓ group, then the lead-in "Nie jest dla was, jeśli…", then a ✕ group, then a CTA. Missing are a per-item `tone` (or `yes`/`no` groups with a `noIntro`) and `cta`.
- Link rows (Moje usługi, Następny etap, Po audycie, "Audyt sprzedaży a audyt CRM") are an intro plus 3–4 links with no items. Missing `links: link[]`.
- Sales Atlas Test is an ordered list plus two closing paragraphs. Missing an `ordered` layout and an `outro`, or number lists in portableText.
- The /wspolpraca steps need `items[].tagline`. The /darmowe-materialy-dla-biznesow-uslugowych cards need `items[].image`.
- Intro-only sections require `items` to be optional.
- Stat numbers are dropped by the refine, so no stat field is needed. The importer must map them to plain items.
- The `Section` match also catches the 66 blog-post FAQ sections, the 4 legal pages and /o-mnie "Dane firmy".

## 5. pricing

**Where.** `pricing-section` on 11 pages:
- /szkolenie-i-wdrozenie-pipedrive, /szkolenie-i-wdrozenie-asana, /szkolenie-i-wdrozenie-salesforce;
- /wdrozenie-ai-w-sprzedazy-b2b, /program-ai-dla-zespolu-sprzedazy, /kurs-ai-w-sprzedazy;
- the four audit pages;
- /automatyzacja-procesow-biznesowych-nocode.

**Current.**
- A full-bleed Mist band with a centred header: the tag eyebrow, an H2 and the market-anchor paragraph.
- 3 Paper cards with `radius.lg` and 32px padding, top-aligned with unequal heights.
- Each card: tier tag, Price with a Fog unit, description, full-width primary pill, then a green check list.
- The `pro` card has a 2px Atlas Blue ring. The `enterprise` card has a 2px cyan ring and a cyan-on-cyan tag at 1.72:1 (audit 11).

**Refine.**
- Keep 3 cards and the anchor paragraph (audit "what works" 2).
- Tier tags in Atlas Blue on Cyan Tint (6.55:1).
- Drop the cyan third tone. Custom-quote plans use the default card.
- Price and unit on one line with Polish thousands spacing ("6 000 zł netto / mies."). The unit is in Slate, not Fog.
- Align the buttons across cards with subgrid.
- Shorten lists with "Wszystko z pakietu …, plus:" (audit 15).
- A proof slot under the grid for the existing "z 5 dni do 2 godzin" outcome (audit 22).

**Fit.** Partial.
- `price: number` is required, but 8 pages have a non-numeric tier ("Wycena indywidualna", "Wycena osobna"). Needs `price?` plus `priceLabel`, and Offer JSON-LD only for numeric plans.
- `unit` mixes one-off, monthly and empty. Needs `billing: 'once'|'month'` and `durationMonths?`.
- /audyt-ai-sprzedaz has a single plan. The block must render one centred card.
- /automatyzacja-procesow-biznesowych-nocode has 4 cards, 2 of which are cross-promos (Newsletter, Program partnerski), not plans. Those should move to promoCard or links.
- Missing `intro` for the anchor paragraph.

## 6. ctaBand

**Where.** "zawlodzki CTA" (an Atlas Blue box) on 13 landing pages, usually after pricing. A Mist box on all 80 blog posts, with copy from the CMS `cta-text`.

**Current.**
- A box with `radius.lg` and 64px padding inside the container.
- `grid-cta` is 0.75fr and 1fr: the Headline on the left, the button on the right.
- Landing: a white heading and a white pill with a primary or cyan ring. Blog: a dark heading and a primary pill.
- No body text.
- Six different labels lead to the same `/kontakt` (audit 4).

**Refine.**
- One site-wide label that includes the call length. The user decides the wording and whether it goes to booking.
- An optional one-line reassurance (25 minutes, online, with Grzegorz).
- The button-on-dark component: a solid Paper pill with no cyan ring and an SVG arrow.
- Add the band to /sales-atlas-system (audit 9).
- At 390 the heading sits above a full-width button.

**Fit.** Fits `heading`, `body` and `cta`. Missing `tone: 'accent'|'soft'` (or derive it from the page type). `cta` should default to the global consultation link so labels cannot drift. The `CTA Section` match also catches the newsletter band (86 pages), so the newsletter must win.

## 7. testimonials

**Where.**
- Two quotes side by side on / and /o-mnie.
- One quote with a company logo on 6 pages: /szkolenie-i-wdrozenie-pipedrive, /szkolenie-i-wdrozenie-asana, the CRM, Asana and sales audit pages, and /automatyzacja-procesow-biznesowych-nocode.
- There is no image wall on the live site. The "8 images" rows in components.json on the AI pages are the tool logo strip.

**Current.**
- Grid: `l-g-2-col` with Mist boxes at 6px radius and 48px padding. The quote is in body text with `<strong>` emphasis, then "- Name, Company" in bold.
- Single: a centred box with 48px × 128px padding, the logo on top, the quote centred.
- At 390 the long quote stays centred.
- No avatars or stars.

**Refine.**
- `<figure>`, `<blockquote>` and `<figcaption>`, with Polish quotes „…” and no typed hyphen.
- Mist surface at `radius.lg`, fluid padding instead of 128px sides.
- Left-align quotes longer than about 45ch, and all quotes on mobile.
- Optionally place the single quote next to pricing as proof (audit 22).
- Never fabricate a quote (PRODUCT.md).

**Fit.** Partial.
- `variant: 'imageWall'` has no live counterpart. Replace the variants with `'grid'|'single'`, or derive them from the item count.
- The testimonial entity needs `quote: portableText` (it has emphasis), `name`, `company`, `role?` and `logo?`.
- The `Testimonials Section` match catches about 20 logo strips. Narrow it to sections containing `testimonial-box` or `testimonial-box-2`.

## 8. promoCard

**Where.** "Sales atlas system info" on 10 pages: Pipedrive, Salesforce, both automation pages, the three AI pages and the AI, CRM and sales audits. It sits after the testimonial or CTA and before the FAQ.

**Current.**
- A full-bleed Night Navy band with the blue gradient.
- On the left: a white H2 "Sales Atlas System", one page-specific paragraph, and a white arrow link.
- On the right: the Sales Atlas badge with a conic cyan glow and rotating rings (`.sas-beam`).
- At 390 the badge renders about 260px wide, a full column.

**Refine.**
- Cap the badge at about 160px on mobile, beside or above the heading.
- The link is a 44px target in Atlas Blue On Dark or Paper, underlined.
- Keep the glow subtle, with static rings under `prefers-reduced-motion`.
- Open question for the user: on pages that also end with the dark newsletter band, a light Atlas Blue Tint card would stop two dark bands from competing. The default stays dark (refine).

**Fit.** Partial. `points: string[]` does not match the content. Live is one paragraph per page, so the block needs `body: text`, with `points` optional or removed. The badge is fixed brand art, rendered in code. The link label is constant.

## 9. faq

**Where.**
- An accordion on 14 pages: service, audit and AI pages, /kurs-ai-w-sprzedazy, /sales-atlas-system and /wspolpraca, with 6–12 items each.
- An open two-column FAQ on 66 blog posts, from the seven CMS field pairs.

**Current.**
- Accordion: a left-aligned header, then a Mist block at 6px radius. Items are padded 16px × 12px, with an "expand_more" ligature on the left, no dividers, and closed by default.
- The triggers are divs, so the accordion cannot be used from a keyboard (audit 7).
- Blog: always open, the question in bold at 40% and the answer at 60%, with hairline separators.

**Refine.**
- `<details name="faq">`/`<summary>` rows on Mist at `radius.lg`, with hairline dividers and an SVG chevron on the right that rotates on open.
- Summary at least 44px tall. Answers capped at 65ch.
- An optional `::details-content` height transition, with no motion under reduced motion.
- Blog FAQ: keep the open two-column layout on wide containers and stack below about 40rem.
- The Sales Atlas FAQ answer changes "250" to "500".

**Fit.** Fits `items` and `emitSchema`. Missing `variant: 'accordion'|'open'` if the blog FAQ renders through this component. Flag: /audyt-ai-sprzedaz uses the accordion for "Czego audyt nie obejmuje", which is a scope list, not an FAQ. Map it to contentSection (checklist with ✕), or at least `emitSchema: false`.

## 10. contactForm

**Where.**
- "kontakt zawlodzki" on 15 pages (/, service, audit and AI pages, kurs, /program-partnerski).
- /kontakt has the full form with the booking embed.
- /o-mnie shows the contact details only.
- /wspolpraca has a legacy form.

**Current.**
- A centred header ("Skontaktuj się ze mną").
- A Mist card at 20px radius with 64px padding, two columns and a 48px gap.
- Left: E-mail, Telefon and Temat rozmowy fields with placeholder labels, a privacy note, 2 consents, and a full-width primary pill.
- Right: a portrait, "Bezpośredni kontakt", and email and phone with icon ligatures.
- At 390 the form comes first, inside the same card.

**Refine.**
- Visible labels, `autocomplete="email"` and `"tel"`, required markers and unique ids. The placeholder colour moves from Fog to Slate (audit 8).
- The token focus ring on fields (audit 14).
- One reassurance line by the submit button, using only true facts.
- The booking link as an equal alternative in the details column. The user confirms cal.com or zencal.
- Keep the portrait, the two-column card, the 32 hidden attribution fields and Turnstile (AGENTS.md).
- Consider 1.4fr and 1fr so the form gets more room.

**Fit.** Partial.
- Missing `intro` and a booking setting (`booking: {kind, url}`). /kontakt embeds a zencal widget that no field models.
- /o-mnie and the second /kontakt section show details without a form. Needs `variant: 'detailsOnly'` or a separate contactDetails block.

## 11. newsletterSignup

**Where.** `cta-section c-b-gradient-dark` on 86 pages: all 80 posts, /, /blog, /kontakt, /o-mnie, /newsletter and /darmowe-materialy-dla-biznesow-uslugowych. It is the last section before the footer, and the first section on /newsletter.

**Current.**
- A full-bleed Night Navy band, centred.
- The H2 "Newsletter Sales Atlas" with a cyan-to-white gradient on "Atlas", and a two-line description.
- An inline email field and a white pill with a cyan ring.
- Legal links in Atlas Blue on navy at 2.59:1 (audit 12).
- At 390 the field and button stay side by side, with the field about 55% wide.

**Refine.**
- "Atlas" in solid Signal Cyan (9.90:1 on navy) instead of the gradient.
- Legal links in Atlas Blue On Dark, underlined.
- A visible or visually hidden label, plus `autocomplete="email"`.
- Below about 24rem, the field and button stack full width at 44px.
- The button-on-dark component, without the cyan ring.
- A unique id (home duplicates `id="newsletter"`).

**Fit.** Fits `body`. Missing `variant: 'band'|'hero'` for /newsletter, where the band opens the page and no H1 exists.

## 12. richText

**Where.**
- Legal pages: /regulamin, /polityka-prywatnosci, /regulamin-newslettera and /lista-cookies-i-identyfikatorow. Each is a `section` with an H1 and raw HTML in a `w-embed`.
- /o-mnie "Dane firmy".
- The blog post body uses the same prose styles but is the post template, not a page block.

**Current.**
- Posts: a 760px column (about 90 characters per line), Satoshi Body, Erode H2 and H3.
- `div.rich-table` tables, a sticky TOC at ≥1280px, the author box (its background is a broken Webflow swatch, so it renders transparent).
- Legal pages: px-fixed embed CSS with its own near-duplicate greys.
- At 390 post tables clip a column (audit 18).

**Refine.**
- One prose style for posts, legal and static text: a 68ch measure, `text-wrap: pretty`, and the type roles from DESIGN.md.
- Tables in an inline-size container with a visible overflow cue, or rows stacked as cards in narrow containers.
- The TOC in Slate with a mono label from the system stack.
- The author box on Mist with `radius.lg`.
- Legal embed HTML converts to Portable Text and drops its private palette.

**Fit.** Fits `body: portableText`. Lists are missing: portableText declares no bullet or number styles, and legal pages and Sales Atlas need them. Contract request. The `blog-article` match mostly catches post-list sections (related, recent, the index), which are not rich text.

## Sections no block fits

These are flagged for the blocks.json owner (coordinator). They are not a design misfit of the blocks above.

1. **Sales Atlas layer explorer** (`tabs-vertical`, /sales-atlas-system).
   - 9 vertical tabs, each a number, title and summary. The panel holds a "works" box (Atlas Blue Tint), a "doesn't work" box (Hairline) and a start-here recommendation with two links.
   - At 390 the panel renders above the tab list.
   - Needs a `layerExplorer` block. Refine: native `<details>` on narrow containers and an ARIA tablist on wide ones.
2. **Post lists.** The /blog index, "Powiązane wpisy" on posts, and "Ostatnie wpisy" on /o-mnie and /newsletter. Needs `postList` or layout-level rendering (audit 16, 23).
3. **Contact details without a form.** /o-mnie and /kontakt section 2.
4. **The booking embed** on /kontakt.
5. **The announcement bar.** It is layout, but it needs a document with an `endDate` (audit 3).
