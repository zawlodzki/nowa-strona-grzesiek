---
name: zawlodzki.pl
description: One consultant's site that shows a B2B sales system working, refined from the incumbent Webflow build.
colors:
  ink: "#0e0f11"
  body-ink: "#1e2024"
  slate: "#636b75"
  fog: "#838d95"
  pebble: "#aaafb6"
  stone: "#d0d4d9"
  rule: "#dde1e6"
  hairline: "#edf0f3"
  mist: "#f9fafb"
  paper: "#ffffff"
  atlas-blue: "#3a48cc"
  atlas-blue-hover: "#2e3ba3"
  atlas-blue-pressed: "#232b7a"
  atlas-blue-soft: "#4e5ad1"
  atlas-blue-stroke: "#616dd6"
  atlas-blue-line: "#8991e0"
  atlas-blue-on-dark: "#b0b6eb"
  atlas-blue-tint: "#ebedfa"
  night-navy: "#0b0a47"
  signal-cyan: "#0acffe"
  cyan-tint: "#e7faff"
  done-green: "#52c41a"
  error-red: "#d0463b"
typography:
  display:
    fontFamily: "Erode Variable, Georgia, serif"
    fontSize: "clamp(2.75rem, 2.4946rem + 1.0476vw, 3.4375rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0"
  headline:
    fontFamily: "Erode Variable, Georgia, serif"
    fontSize: "clamp(2.25rem, 2.0411rem + 0.8571vw, 2.8125rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.021em"
  title:
    fontFamily: "Erode Variable, Georgia, serif"
    fontSize: "clamp(1.75rem, 1.5875rem + 0.6667vw, 2.1875rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.019em"
  title-s:
    fontFamily: "Erode Variable, Georgia, serif"
    fontSize: "clamp(1.5rem, 1.3607rem + 0.5714vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.017em"
  title-xs:
    fontFamily: "Erode Variable, Georgia, serif"
    fontSize: "clamp(1.125rem, 1.0205rem + 0.4286vw, 1.40625rem)"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.014em"
  body:
    fontFamily: "Satoshi Variable, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.9071rem + 0.3810vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "-0.011em"
  body-s:
    fontFamily: "Satoshi Variable, system-ui, sans-serif"
    fontSize: "clamp(0.875rem, 0.7937rem + 0.3333vw, 1.09375rem)"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "0"
  label:
    fontFamily: "Satoshi Variable, system-ui, sans-serif"
    fontSize: "clamp(0.875rem, 0.7937rem + 0.3333vw, 1.09375rem)"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "0.04em"
  price:
    fontFamily: "Satoshi Variable, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 2.4946rem + 1.0476vw, 3.4375rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "20px"
  pill: "999px"
spacing:
  3xs: "4px"
  2xs: "8px"
  xs: "12px"
  s: "16px"
  m: "24px"
  l: "32px"
  xl: "40px"
  2xl: "48px"
  3xl: "64px"
  4xl: "128px"
components:
  button-primary:
    backgroundColor: "{colors.atlas-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.atlas-blue-hover}"
    textColor: "{colors.paper}"
  button-primary-pressed:
    backgroundColor: "{colors.atlas-blue-pressed}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.atlas-blue}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.cyan-tint}"
    textColor: "{colors.atlas-blue-hover}"
  button-on-dark:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.atlas-blue}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.body-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  tag:
    backgroundColor: "{colors.cyan-tint}"
    textColor: "{colors.atlas-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
  card-surface:
    backgroundColor: "{colors.mist}"
    rounded: "{rounded.lg}"
    padding: "clamp(24px, 6vw, 64px)"
  card-pricing:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "32px"
  band-dark:
    backgroundColor: "{colors.night-navy}"
    textColor: "{colors.paper}"
  band-accent:
    backgroundColor: "{colors.atlas-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
  nav-link:
    textColor: "{colors.slate}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  nav-link-hover:
    textColor: "{colors.atlas-blue}"
---

# Design System: zawlodzki.pl

Captured from the live Webflow site on 2026-10-21 (`migration/00-inventory/live-site/`, the compiled `zawlodzki.webflow.shared.*.css`, and the T03 screenshots in `migration/lanes/design/out/screens/`). Scope is refine, not redesign (`migration/contracts/decisions.md` row 2). Values in the frontmatter are normative. `migration/lanes/design/out/tokens.json` carries the same values in DTCG form with the page and selector each one was seen on. Where a value is a refine and not the incumbent, the prose says so.

## Overview

**Creative North Star: "The Working Pipeline"**

The site is a consultant's workbench seen through a clean window. White paper, ink-dark Erode headings and one confident blue carry the page. The brand lives in the product scenes (the Pipedrive pipeline with the "Acme €24,000" deal, the "Sales Agent" panel, the automation flow, the nine-layer Sales Atlas stack), in the GZ monogram behind the portrait, and in first-person copy that names real manual work. Everything else steps back so those three read first.

The incumbent is a Webflow SaaS template (SystemFlow) with his scenes inside it. Refining it means two moves at once. Strengthen what is his: scenes, monogram, voice, transparent pricing. Quiet what is template: gradient keyword text, count-up stats, the 24-logo wall, cyan used as text, centred multi-paragraph heroes.

Density is generous on marketing pages (64px section rhythm, 20px body text on desktop) and calm on the blog (a 760px column, real tables, a sticky TOC). Motion belongs to the scenes and to state changes only.

**Key Characteristics:**
- Serif display (Erode) over a geometric grotesk body (Satoshi), both variable.
- One accent, Atlas Blue (#3a48cc), on a cool-neutral ramp. Night Navy (#0b0a47) for the dark bands.
- Signal Cyan is decoration: borders, rings, scene accents, never text on light.
- Pill buttons, 6px small radius, 20px large surfaces.
- Flat, with low ambient shadows only on the nav, cards and inputs.
- Product scenes are the illustration system. No stock imagery, no generic icons as hero art.

## Colors

A cool, near-monochrome ramp with one saturated blue and a cyan kept for ornament.

### Primary
- **Atlas Blue** (atlas-blue): links, the primary button, focus rings, the accent CTA band, check marks. 7.05:1 on paper, so it is safe as text at any size.
- **Atlas Blue Hover / Pressed** (atlas-blue-hover, atlas-blue-pressed): hover and pressed states of buttons and links.
- **Atlas Blue Soft / Stroke / Line** (atlas-blue-soft, atlas-blue-stroke, atlas-blue-line): fluid-button hover, input hover stroke, scene strokes. Never text.
- **Atlas Blue On Dark** (atlas-blue-on-dark): links on Night Navy. 9.35:1. This is a refine. Today those links are Atlas Blue at 2.59:1 (audit finding 12).
- **Atlas Blue Tint** (atlas-blue-tint): tinted surfaces ("works" box on Sales Atlas) and muted text on dark (15.69:1).

### Secondary
- **Signal Cyan** (signal-cyan): the secondary button border, the custom-plan ring, scene accents, the "Atlas" word in the newsletter heading on navy (9.90:1). It is 1.85:1 on paper.
- **Cyan Tint** (cyan-tint): the feature-icon tile and tag background. Tag text on it is Atlas Blue (6.55:1). The live tag is cyan on cyan tint at 1.72:1 (audit finding 11).

### Tertiary
- **Night Navy** (night-navy): the dark surface of the promo bar, the newsletter band and the Sales Atlas promo band. Live, it is a raw hex with no variable, painted as `linear-gradient(45deg, #0b0a47 50%, #3a48cc)`. The refine keeps navy and drops the gradient to a solid surface, or keeps the gradient only behind non-text areas.

### Neutral
- **Ink** (ink): headings and default text.
- **Body Ink** (body-ink): paragraphs and list items.
- **Slate** (slate): muted text. Nav and footer links, meta, breadcrumbs, taglines, placeholders. 5.40:1 on paper, 4.72:1 on hairline.
- **Fog** (fog) and **Pebble** (pebble): non-text only. Icons, separators, decorative rules. Fog is today's tagline and placeholder colour at 3.38:1, which fails WCAG 1.4.3 (audit finding 10).
- **Stone**, **Rule**, **Hairline** (stone, rule, hairline): strong border, default border and input stroke, divider.
- **Mist** (mist): soft surfaces. Pricing band, contact card, FAQ block, testimonials.
- **Paper** (paper): page background, text on dark.

### Status
- **Error Red** (error-red): field errors and the ✕ marks in fit lists. 4.54:1. It replaces SystemFlow's #f5222d (4.08:1).
- **Done Green** (done-green): success marks inside scenes only. 2.27:1, never text.

### Named Rules
**The Text-Safe Rule.** A colour used for text passes 4.5:1 on the surface it sits on, by construction. Text roles are ink, body-ink, slate, atlas-blue (and its hover and pressed steps), error-red on light, and paper, atlas-blue-tint, atlas-blue-on-dark on navy. Fog, pebble, signal-cyan and done-green never carry text on light.

**The One Blue Rule.** Atlas Blue is the only saturated colour that carries meaning on a page. Cyan decorates, green and red only mark state. No gradient-clipped text.

**The Live-Only Palette Rule.** Every colour here renders on a live page today (cited in `tokens.json`). The 50 SystemFlow variables no page uses (info, warning, most of success, error and secondary) are not ported. Scenes read these tokens instead of redeclaring hex (audit finding 26).

## Typography

**Display Font:** Erode Variable (with Georgia, serif)
**Body Font:** Satoshi Variable (with system-ui, sans-serif)
**Label/Mono Font:** ui-monospace for the blog TOC label. The live CSS names Geist Mono, which is never loaded.

**Character:** A warm, slightly literary serif for claims and a neutral geometric sans for everything you act on. The pairing says "advisor", not "SaaS".

### The root font-size quirk
The live site sets `html { font-size: 20px }`, and 16px at ≤991px, in the global Custom Code embed. Every rem value therefore renders 25% larger on desktop and jumps at 991/992px. The system keeps the rendered sizes and drops the hack. The root stays at the browser default (100%). Each role is a `clamp()` that interpolates linearly from its 390px size (the old 16px-root value) to its 1440px size (the old 20px-root value). At 390 and at 1440 the page renders what it renders today, and between them the jump at 991px is gone.

### Hierarchy

Sizes are given as rendered px at 390 → 1440.

- **Display** (Erode 700, 44 → 55px, line-height 1.1): the hero H1 only.
- **Headline** (Erode 700, 36 → 45px, 1.1, −0.021em): section H2s.
- **Title** (Erode 600, 28 → 35px, 1.25, −0.019em): H3s, sub-sections, steps.
- **Title S** (Erode 600, 24 → 30px, 1.25): H4, group titles.
- **Title XS** (Erode 600, 18 → 22.5px, 1.5): card titles.
- **Body** (Satoshi 400, 16 → 20px, 1.75, −0.011em): paragraphs, list items, inputs, buttons (500 on buttons). Prose is capped at 68ch.
- **Body S** (Satoshi 400, 14 → 17.5px, 1.43): captions, meta, form help, the promo bar.
- **Label** (Satoshi 500, 14 → 17.5px, 1.6, +0.04em, uppercase): taglines and eyebrows, in Slate. Refine. Live is 400 weight, −0.006em, Fog.
- **Price** (Satoshi 600, 44 → 55px, 1, −0.02em): plan prices, with the unit in Body S on the same line.

Blog rich text uses the same sizes. Its H2 and H3 are Erode 600 at the Headline and Title sizes with 1.25 line-height. Blockquote is Erode 600 in Atlas Blue with a 1px Stone rule on the left. Use the real italic face, not a synthesized oblique.

### Named Rules
**The Wrap Rule.** Headings get `text-wrap: balance`, body text gets `text-wrap: pretty`. Prose never runs past 68ch.

**The Fixed-Ends Rule.** A role renders the same px at 390 and at 1440 as the live site. T08 is checked against these two widths.

## Layout

- **Container:** max 1248px, centred. Side gutter is fluid, 16px at 390 to 24px at 1440.
- **Section rhythm:** 64px block padding on desktop. Refine: 48px at 390, fluid between.
- **Section intro:** the live intro takes 50% of the row and leaves the other half empty (audit finding 27). An intro-only section becomes a single column capped at about 40rem. An intro above a grid keeps its left alignment.
- **Two-column feature:** 1.5fr text and 1fr media, media alternating right and left in step sequences. Below 992px it stacks with the text first.
- **Grids:** 3 and 4 columns with a 24px gap (16px narrower). Cards stack at 768px.
- **Boxed surfaces** (CTA band, contact card): 64px padding, 24px at 390.
- **Blog:** a 760px article column. At ≥1280px a 200px sticky TOC sits to the left and a 200px CTA rail to the right, both 28px off the column.
- **Breakpoints:** 480, 768, 992 and 1280px, min-width. Webflow's were max-width 479/767/991. Components prefer container queries. The breakpoints are for page-level shells.
- **Mobile hero:** H1 first, then body, then CTA, then a smaller portrait (audit finding 2). Text is left-aligned at every width.

## Elevation & Depth

Flat by default. Depth comes from tonal layering (Paper, Mist, Night Navy) and from a few soft ambient shadows tinted with the neutral ramp.

### Shadow Vocabulary
- **Nav** (`box-shadow: 0 1px 10px 0 #dde1e6`): the sticky header, with a 1px Hairline border.
- **Input** (`0 1px 3px #00000014`): text fields at rest.
- **Card** (`0 4px 8px #5d637026`), **Card hover** (`0 6px 10px #5d637033`): post cards.
- **Panel** (`0 8px 24px #00000014`): the Sales Atlas layer panel.
- **Focus ring** (`0 0 0 2px #ffffff, 0 0 0 5px #3a48cc`): on every interactive element via `:focus-visible`. Live, it exists on buttons only and `outline: 0` removes it elsewhere (audit finding 14).

### Named Rules
**The Flat-Surface Rule.** Sections, bands and feature rows never carry a shadow. Only the nav, inputs, cards and one panel do. The scenes draw their own light cards.

## Shapes

Soft but not bubbly. Small parts (inputs, tags, nav links, FAQ block, image corners) use 6px. Scene cards use 10px. Large surfaces (CTA band, pricing cards, contact card, hero image, author box, blog hero image) use 20px. Buttons are full pills. Avatars are circles. Borders are 1px hairlines. 2px marks the featured plan, 3px marks the secondary button and the link hover underline.

The live site mixes 6px and 20px across sibling surfaces (testimonial boxes 6px next to 20px CTA and contact cards). The refine puts every boxed surface on 20px and keeps 6px for parts inside surfaces. The blog hero image moves from 16px to 20px.

## Components

### Buttons
Confident and round.
- **Shape:** full pill (999px), minimum height 44px.
- **Primary:** Atlas Blue fill, Paper text in Satoshi 500 at Body size, 8px × 24px padding. Hover Atlas Blue Hover. Pressed Atlas Blue Pressed. Transition background-color 250ms. Refine: drop the live hover gradient (`linear-gradient(270deg, black, #3a48cc)`) and the #e7faff hover text.
- **Secondary:** Paper fill, Atlas Blue text, 3px Signal Cyan border. Hover Cyan Tint fill with the border turning Atlas Blue Hover. Refine: the pressed state uses Atlas Blue Tint, because the live #08a6cb puts blue text at 2.46:1.
- **On dark:** solid Paper fill with Atlas Blue text and no cyan ring (newsletter and CTA bands).
- **Icons:** inline SVG arrows with `aria-hidden="true"`. They replace Material Icons ligatures, which leak "arrow_forward" into accessible names (audit finding 13).
- **Full width** below 480px.

### Links
- Body links: Atlas Blue, underlined, offset 0.18em. Hover Atlas Blue Hover.
- Inline action links ("Zobacz Sales Atlas System →"): Atlas Blue 500, no underline at rest, a 3px underline on hover. A minimum 44px tap height when standalone.
- On dark: Atlas Blue On Dark, underlined.

### Tags
A small uppercase Label on Cyan Tint with Atlas Blue text, or on Hairline with Ink text, radius 6px, 0 × 8px padding. Used for pricing tiers and the pricing-section eyebrow.

### Cards / Containers
- **Surface card** (contact card, testimonial, FAQ block): Mist, 20px radius, fluid 24–64px padding, no shadow.
- **Pricing card:** Paper, 20px radius, 32px padding, an inset 1px Rule ring. The featured plan has a 2px Atlas Blue ring. Refine: the third "custom" tone's cyan ring is dropped. Buttons align across cards (subgrid).
- **Post card:** Paper, 6px radius, Card shadow, image 6px radius. Refine: text-led with a date and a one-line excerpt (audit finding 16).
- **Accent band (ctaBand):** Atlas Blue box with 20px radius and 64px padding inside the container. White Headline on the left, the on-dark button on the right. The blog variant is Mist with a dark heading and the primary button.
- **Dark band (newsletter, Sales Atlas promo):** full-bleed Night Navy.

### Inputs / Fields
- **Style:** Paper, 1px Rule stroke, 6px radius, 44px height, 8px × 12px padding, Body size, Input shadow.
- **Label:** visible, above the field, Body S 500 in Body Ink, with a required marker. Live fields are placeholder-only (audit finding 8).
- **Placeholder:** Slate, and never the only label.
- **Hover / Focus:** Atlas Blue Stroke on hover, Atlas Blue stroke plus the focus ring on focus.
- **Error:** Error Red stroke and an Error Red Body S message under the field.

### Navigation
Sticky Paper bar with a 1px Hairline bottom border and the Nav shadow. The logo is 44px (55px on desktop). Links are Slate, 8px × 16px, 6px radius. Hover Atlas Blue. The current page is Ink with `aria-current`. The live current link leaks Webflow's #0082f3, which is not ported. The primary pill CTA sits at the right. Below 992px it collapses into a Paper sheet. The promo bar above it is Night Navy with Body S 500 Paper text, one line on mobile, and it hides itself after its end date.

### FAQ
Native `<details>`/`<summary>` rows on Mist, hairline dividers between items, an SVG chevron on the right, a summary at least 44px tall, answers capped at 65ch.

### Product Scenes (signature)
Inline SVG/HTML scenes (`#zw-*`) on Paper scene cards with 10px radius, hairline borders and the Card shadow. They are `aria-hidden`, run once on intersection, and resolve to a static end state under `prefers-reduced-motion`. Refine (T11): read colours from these tokens, Polish strings, a reflowed mobile layout with a 12px rendered label floor, and `will-change` only during playback.

### Portrait and Monogram (signature)
The portrait cut-out in front of the Erode "GZ" monogram in Atlas Blue. It is the hero art on home and becomes the hero art on service pages too, in place of the cropped vendor wordmarks (audit finding 19).

## Do's and Don'ts

### Do:
- **Do** set text only in ink, body-ink, slate, atlas-blue or error-red on light surfaces, and in paper, atlas-blue-tint or atlas-blue-on-dark on Night Navy.
- **Do** render each type role at its 390px and 1440px values exactly, with `clamp()` between them and the root at 100%.
- **Do** give every interactive element the 2px Paper plus 5px Atlas Blue focus ring on `:focus-visible`.
- **Do** keep buttons as pills at least 44px tall, and standalone links at least 44px tall.
- **Do** put the H1 first on mobile heroes and left-align hero text.
- **Do** use inline SVG icons with `aria-hidden="true"`.
- **Do** use 20px radius for boxed surfaces and 6px for parts inside them.

### Don't:
- **Don't** set `html { font-size: 20px }` or any px root size.
- **Don't** clip gradients to text (`.c-t-gradient-primary`, `.gradient-secondary`). Mark a keyword with weight or solid Atlas Blue.
- **Don't** use Signal Cyan, Fog, Pebble or Done Green for text on light surfaces.
- **Don't** port the unused SystemFlow palette, the Ant-blue `.button.secondary` family (#2f54eb, #1d39c4, #adc6ff, #f0f5ff), Webflow's #0082f3 current link, or the off-scale greys hard-coded in scenes.
- **Don't** use count-up numbers for trivial deliverables.
- **Don't** use bounce or overshoot easing outside the consent root.
- **Don't** load Material Icons, Geist Mono, or TTF fonts.
