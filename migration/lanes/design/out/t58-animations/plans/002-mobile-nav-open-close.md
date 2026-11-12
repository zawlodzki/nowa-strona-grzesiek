# 002 — Fade and slide the mobile nav panel open and closed

- **Status**: DONE — Chromium live proof at 390px and 1440px
- **Commit**: 2522982
- **Severity**: MEDIUM
- **Category**: Missed opportunity (preventing a jarring change, spatial consistency)
- **Estimated scope**: 1 file (`apps/web/src/components/site/Header.astro`), about 35 changed lines, CSS only

## Problem

Below 992px the nav panel jumps from `display: none` to `display: flex` when the menu button is pressed, and vanishes the same way. Every phone visitor who opens the menu sees a panel teleport over the page.

```css
/* apps/web/src/components/site/Header.astro:129-141 — current */
.site-nav { display: none; }

.nav-toggle[aria-expanded='true'] + .site-nav {
  display: flex;
  position: absolute;
  inset-inline: 0;
  inset-block-start: 100%;
  padding-block: var(--space-2xs);
  padding-inline: var(--layout-gutter);
  background: var(--surface-page);
  border-block-end: var(--border-width-hairline) solid var(--border-hairline);
  box-shadow: var(--shadow-nav);
}
```

```css
/* Header.astro:151-157 — current */
.nav-toggle[aria-expanded='true'] + .site-nav ul {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3xs);
  inline-size: 100%;
}

/* Header.astro:190-193 — current */
.nav-toggle[aria-expanded='true'] + .site-nav .pill,
.nav-toggle[aria-expanded='true'] + .site-nav .pill-link {
  inline-size: 100%;
}
```

The positioning and inner layout exist only in the open state. An exit animation needs them in the closed state too, otherwise the panel loses `position: absolute` and its column layout while it fades out.

## Target

The panel fades in and drops 8px into place over `250ms`, and leaves the same way over `150ms`. Under reduced motion it only fades. Desktop (992px and wider) is unchanged.

```css
/* target: replaces Header.astro:129-141 */
.site-nav {
  display: none;
  position: absolute;
  inset-inline: 0;
  inset-block-start: 100%;
  padding-block: var(--space-2xs);
  padding-inline: var(--layout-gutter);
  background: var(--surface-page);
  border-block-end: var(--border-width-hairline) solid var(--border-hairline);
  box-shadow: var(--shadow-nav);
  opacity: 0;
  /* Closing uses this faster duration. */
  transition: opacity var(--motion-duration-fast) var(--motion-easing-out), display var(--motion-duration-fast) allow-discrete;
}

.nav-toggle[aria-expanded='true'] + .site-nav {
  display: flex;
  opacity: 1;
  transition-duration: var(--motion-duration-base);
}

@starting-style {
  .nav-toggle[aria-expanded='true'] + .site-nav { opacity: 0; }
}

@media (prefers-reduced-motion: no-preference) {
  .site-nav {
    translate: 0 -8px;
    transition: opacity var(--motion-duration-fast) var(--motion-easing-out), translate var(--motion-duration-fast) var(--motion-easing-out), display var(--motion-duration-fast) allow-discrete;
  }
  .nav-toggle[aria-expanded='true'] + .site-nav { translate: 0 0; }
  @starting-style {
    .nav-toggle[aria-expanded='true'] + .site-nav { opacity: 0; translate: 0 -8px; }
  }
}
```

```css
/* target: replaces Header.astro:151-157, selector no longer depends on the open state */
.site-nav ul {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-3xs);
  inline-size: 100%;
}

/* target: replaces Header.astro:190-193 */
.site-nav .pill,
.site-nav .pill-link {
  inline-size: 100%;
}
```

```css
/* target: add to the existing desktop rule at Header.astro:218-233
   (.site-nav, .nav-toggle[aria-expanded='true'] + .site-nav inside @media (width >= 992px)) */
opacity: 1;
translate: none;
transition: none;
```

Token values (`apps/web/src/styles/tokens.css:139-143`): `--motion-duration-fast: 150ms`, `--motion-duration-base: 250ms`, `--motion-easing-out: cubic-bezier(0.2, 0.8, 0.2, 1)`.

## Repo conventions to follow

- Discrete transitions with `allow-discrete` are already used in `apps/web/src/components/blocks/Faq.astro:62-69`. Imitate its token usage.
- Use the standalone `translate` property, as the repo uses `scale` and `rotate` (`Faq.astro:55`, `LeadForm.astro:175`).
- Movement goes inside `@media (prefers-reduced-motion: no-preference)`. The opacity fade stays for everyone.
- Logical properties only (`inset-inline`, `padding-block`), as in the rest of the file.
- `AGENTS.md` requires following the `good-css` skill (`.claude/skills/good-css/SKILL.md`) before editing any CSS.

## Steps

1. Replace `Header.astro:129-141` with the first Target block.
2. Merge the existing bare `.site-nav ul` rule (`:143-149`, margin/padding/list-style reset) with the new unconditional layout: keep its reset declarations and add the five layout declarations from the second Target block. Delete the old `.nav-toggle[aria-expanded='true'] + .site-nav ul` rule at `:151-157`.
3. Replace the selector at `:190-193` with `.site-nav .pill, .site-nav .pill-link`.
4. In the desktop media query (`:213-253`), add `opacity: 1; translate: none; transition: none;` to the rule that starts `.site-nav, .nav-toggle[aria-expanded='true'] + .site-nav`. Leave the other desktop rules as they are: they come later in the file with equal specificity and keep overriding the mobile layout.
5. Build and inspect the emitted CSS to confirm Astro's style scoping kept the `@starting-style` rules. This could not be confirmed from the source alone.

## Boundaries

- Do NOT change markup, the `<script>`, or `apps/web/src/components/site/disclosure.ts`. The open state stays driven by `aria-expanded`.
- Do NOT animate the hamburger icon.
- Do NOT animate anything at 992px and wider.
- Do NOT add dependencies or new tokens.
- If a step doesn't match the code you find (drift since commit 2522982), STOP and report instead of improvising.

## Verification

- **Mechanical**: from the repo root run `pnpm --filter web check`, `pnpm --filter web test` (includes `disclosure.test.ts`) and `pnpm --filter web build`. All must pass.
- **Feel check**: run the site at a 390px viewport.
  - Tap the menu button: the panel fades in while settling down 8px. It does not pop.
  - Tap again or press Escape: it leaves faster than it arrived, and the links keep their column layout and the pill keeps full width until the panel is gone.
  - Tap the button rapidly several times: the panel reverses from where it is and never restarts from zero.
  - In the DevTools Animations panel at 10% speed, confirm the panel never overlaps the logo or the menu button while it is visibly opaque.
  - Emulate `prefers-reduced-motion: reduce`: the panel fades with no vertical movement.
  - At 1440px the nav is a static row, always visible, with no fade on load or on resize across 992px.
  - With JavaScript disabled the panel stays closed on mobile, same as today.
- **Done when**: the checks above hold in a Chromium browser and in Safari, and in a browser without `@starting-style` support the menu still opens and closes instantly.

Execution evidence and compatibility limits: [verification notes](../verification-notes.md).
