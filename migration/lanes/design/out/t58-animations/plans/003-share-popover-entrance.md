# 003 — Scale the share popover in from its trigger

- **Status**: TODO
- **Commit**: 2522982
- **Severity**: LOW
- **Category**: Missed opportunity (spatial consistency)
- **Estimated scope**: 1 file (`apps/web/src/components/post/SharePost.astro`), about 15 added lines, CSS only

## Problem

The share panel is a native `popover` that appears and disappears instantly, with nothing tying it to the "share" button that opened it.

```css
/* apps/web/src/components/post/SharePost.astro:54 — current (one line in the file) */
[popover] { inline-size: min(23rem, calc(100vi - 2 * var(--space-s))); max-block-size: calc(100dvh - 2 * var(--space-s)); overflow-y: auto; overscroll-behavior: contain; padding: var(--space-s); border: 1px solid var(--border-hairline); border-radius: var(--radius-lg); background: var(--surface-page); color: var(--text-body); box-shadow: var(--shadow-panel); }
```

```css
/* SharePost.astro:66-71 — current: anchored below the trigger where supported, centred otherwise */
@supports (position-area: block-end) {
  [popover] { margin: 0; margin-block-start: .5rem; position-area: block-end span-inline-end; position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline, --share-centered, --share-centered flip-block, --share-viewport; }
  @position-try --share-centered { position-area: block-end; }
  @position-try --share-viewport { position-area: none; inset-block: var(--space-s); inset-inline: var(--space-s); margin: auto; }
  [popover]:has(.manual:not([hidden]), [role="status"]:not(:empty)) { position-area: none; inset-block: var(--space-s); inset-inline: var(--space-s); margin: auto; }
}
```

## Target

The panel fades in over `150ms` and grows from `scale: 0.97`, with its origin at the top edge when it is anchored below the trigger and at the centre when it is centred in the viewport. It leaves the same way. Under reduced motion it only fades.

```css
/* target: add after SharePost.astro:54 */
[popover] {
  opacity: 0;
  transform-origin: center;
  transition: opacity var(--motion-duration-fast) var(--motion-easing-out), overlay var(--motion-duration-fast) allow-discrete, display var(--motion-duration-fast) allow-discrete;
}
[popover]:popover-open { opacity: 1; }
@starting-style {
  [popover]:popover-open { opacity: 0; }
}
@media (prefers-reduced-motion: no-preference) {
  [popover] {
    scale: 0.97;
    transition: opacity var(--motion-duration-fast) var(--motion-easing-out), scale var(--motion-duration-fast) var(--motion-easing-out), overlay var(--motion-duration-fast) allow-discrete, display var(--motion-duration-fast) allow-discrete;
  }
  [popover]:popover-open { scale: 1; }
  @starting-style {
    [popover]:popover-open { opacity: 0; scale: 0.97; }
  }
}
```

```css
/* target: inside the existing @supports (position-area: block-end) block */
[popover] { transform-origin: top; }          /* add this declaration to the first rule in the block */
[popover]:has(.manual:not([hidden]), [role="status"]:not(:empty)) { transform-origin: center; }  /* add this declaration to the last rule in the block */
```

Token values (`apps/web/src/styles/tokens.css:139-143`): `--motion-duration-fast: 150ms`, `--motion-easing-out: cubic-bezier(0.2, 0.8, 0.2, 1)`.

Never use `scale: 0`. The starting scale is `0.97`.

## Repo conventions to follow

- `allow-discrete` transitions with motion tokens: `apps/web/src/components/blocks/Faq.astro:62-69`.
- Standalone `scale` property: `apps/web/src/components/forms/LeadForm.astro:175`.
- Movement and scale go inside `@media (prefers-reduced-motion: no-preference)`. The opacity fade stays for everyone.
- This file keeps each rule on one line; match that style when adding declarations to existing rules.
- `AGENTS.md` requires following the `good-css` skill (`.claude/skills/good-css/SKILL.md`) before editing any CSS.

## Steps

1. Add the first Target block after line 54.
2. In the `@supports (position-area: block-end)` block, add `transform-origin: top;` to the first `[popover]` rule (line 67).
3. In the same block, add `transform-origin: center;` to the `[popover]:has(…)` rule (line 70).
4. Build and inspect the emitted CSS to confirm Astro's style scoping kept the `@starting-style` rules.

## Boundaries

- Do NOT change markup, the copy-link script, or the anchor-positioning rules beyond the two `transform-origin` declarations.
- Do NOT try to animate the panel's jump to the viewport centre after "copy link". That is a layout change and is out of scope.
- Do NOT add a `::backdrop`.
- Do NOT add dependencies or new tokens.
- If a step doesn't match the code you find (drift since commit 2522982), STOP and report instead of improvising.

## Verification

- **Mechanical**: from the repo root run `pnpm --filter web check`, `pnpm --filter web test` and `pnpm --filter web build`. All must pass.
- **Feel check**: open any blog post and scroll to the share button.
  - Click it: the panel fades in and grows slightly from its top edge, towards the button.
  - Close with the X button, with Escape and by clicking outside: each exit fades out instead of vanishing.
  - In the DevTools Animations panel at 10% speed, confirm the growth starts near full size (0.97), not from a point.
  - Scroll so the button is near the bottom of the viewport and open the panel. It flips above the button, and the origin is then on the far edge. Judge whether that is noticeable at 0.97. If it is, report it; do not invent a fix.
  - Emulate `prefers-reduced-motion: reduce`: fade only, no scale.
  - In a browser without anchor positioning the panel is centred and scales from its centre.
- **Done when**: open and all three close paths animate in Chromium, Safari shows at least the entrance, and a browser without `@starting-style` still opens and closes the panel instantly.
