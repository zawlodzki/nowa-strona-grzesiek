# 005 — Fade tab panel content and ease the selected tab

- **Status**: DONE — colour-only fallback; verified on /sales-atlas-system
- **Commit**: 2522982
- **Severity**: LOW
- **Category**: Missed opportunity (preventing a jarring change, state indication)
- **Estimated scope**: 1 file (`apps/web/src/components/blocks/Tabs.astro`), about 12 CSS lines and 3 script lines

## Problem

Switching a tab swaps the whole panel in one frame, and the selected tab's blue background jumps from one tab to the next. On desktop the switch is driven by scrolling through a pinned section, so the content changes under the reader with no bridge.

```ts
// apps/web/src/components/blocks/Tabs.astro:55-62 — current
function activate(index: number) {
  current = index;
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    panels[i].hidden = i !== index;
  });
}
```

```ts
// Tabs.astro:71-80 — current: measures every panel by showing each one in turn
function fitsViewport() {
  const was = current;
  let tallest = 0;
  root.style.removeProperty('--stage-size');
  panels.forEach((_, i) => { activate(i); tallest = Math.max(tallest, stage.offsetHeight); });
  activate(was);
  // A constant stage height keeps the track length fixed, so switching layers never shifts the page.
  root.style.setProperty('--stage-size', `${tallest}px`);
  return tallest <= innerHeight - offset + slack;
}
```

```css
/* Tabs.astro:131-132 and :141 — current */
.menu a { display: grid; gap: var(--space-xs); padding: 16px 24px; border-radius: var(--radius-sm); text-decoration: none; color: var(--text-body); }
.menu a[aria-selected="true"] { background: var(--surface-accent); color: var(--text-on-accent); }
.panel:not([hidden]) { display: grid; gap: var(--space-m); }
```

`fitsViewport()` runs on load, on resize and when fonts finish loading. It hides and re-shows the active panel, so any entrance animation would replay on every resize unless it is switched off during measurement.

## Target

The content inside the newly shown panel fades in over `150ms`. The panel's card (border, background, shadow) does not fade, so the frame stays solid while the content changes. The tab's background and text colour ease over `150ms`. Nothing moves: on desktop the page is already scrolling, and extra movement would fight it.

```css
/* target: add after Tabs.astro:141 */
.panel > :global(*) { transition: opacity var(--motion-duration-fast) var(--motion-easing-out); }
@starting-style {
  .panel:not([hidden]) > :global(*) { opacity: 0; }
}
[data-measuring] .panel > :global(*) { transition: none; }

@media (prefers-reduced-motion: no-preference) {
  .menu a { transition: background-color var(--motion-duration-fast) var(--motion-easing-out), color var(--motion-duration-fast) var(--motion-easing-out); }
}
```

```ts
// target: Tabs.astro:71-80
function fitsViewport() {
  const was = current;
  let tallest = 0;
  root.dataset.measuring = 'true';
  root.style.removeProperty('--stage-size');
  panels.forEach((_, i) => { activate(i); tallest = Math.max(tallest, stage.offsetHeight); });
  activate(was);
  // Flush styles while transitions are off, so re-showing the active panel after measuring does not replay its fade.
  void stage.offsetHeight;
  delete root.dataset.measuring;
  // A constant stage height keeps the track length fixed, so switching layers never shifts the page.
  root.style.setProperty('--stage-size', `${tallest}px`);
  return tallest <= innerHeight - offset + slack;
}
```

Token values (`apps/web/src/styles/tokens.css:139-143`): `--motion-duration-fast: 150ms`, `--motion-easing-out: cubic-bezier(0.2, 0.8, 0.2, 1)`.

`:global(*)` is required because the panel's children are rendered by other Astro components (`PortableText`, `Button`) and do not carry this component's scope attribute.

## Repo conventions to follow

- Motion tokens and the `no-preference` gate: `apps/web/src/components/blocks/Pricing.astro:113-115`.
- `:global(...)` for children from other components: already used in this file at `:143-147`.
- State flags on the root as `data-*` attributes: this file already uses `data-ready` and `data-scroll`.
- `AGENTS.md` requires following the `good-css` skill (`.claude/skills/good-css/SKILL.md`) before editing any CSS.

## Steps

1. Add the Target CSS after line 141.
2. In `fitsViewport()` add the three script lines shown in Target: set `root.dataset.measuring` before the loop, then after `activate(was)` read `stage.offsetHeight` and delete the attribute.
3. Build and inspect the emitted CSS to confirm the `@starting-style` rule and the `:global(*)` selectors came through scoping as written.

## Boundaries

- Do NOT add any translate, scale or height animation to the panels.
- Do NOT animate the outgoing panel. It is removed at once.
- Do NOT change `activate()`, the scroll pinning maths, the keyboard handling or the ARIA attributes.
- Do NOT animate the summary line that shows only under the selected tab (`:134`).
- Do NOT add dependencies or new tokens.
- If a step doesn't match the code you find (drift since commit 2522982), STOP and report instead of improvising.

## Verification

- **Mechanical**: from the repo root run `pnpm --filter web check`, `pnpm --filter web test` and `pnpm --filter web build`. All must pass.
- **Feel check**: open a page with the tabs block (`/sales-atlas-system`, owner-confirmed current render target) at 1440px and at 390px.
  - Click each tab: the blue background eases to the new tab and the panel content fades in. The card outline does not blink.
  - At 1440px scroll slowly through the pinned section: each layer change fades the content once.
  - Scroll fast through all layers: there is no visible strobing. **This cannot be judged from code.** If the fade reads as a blink during fast scrolling, remove the `.panel > :global(*)` rules and the `data-measuring` lines, keep only the `.menu a` transition, and say so in the handoff.
  - Resize the window and reload the page: the active panel does not fade on load, on resize or when fonts finish loading.
  - Use ArrowUp, ArrowDown, Home and End on the tab list: selection follows the keys without lag.
  - Emulate `prefers-reduced-motion: reduce`: the content still fades, the tab colours change at once, and the section is not pinned (existing behaviour).
- **Done when**: the checks above hold, the measured `--stage-size` value on the root is the same as before the change at 1440px, and the three commands pass.

Execution evidence and compatibility limits: [verification notes](../verification-notes.md).
