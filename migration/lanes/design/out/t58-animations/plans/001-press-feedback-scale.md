# 001 — Add press feedback to pill buttons

- **Status**: DONE — Chromium live proof at 390px and 1440px
- **Commit**: 2522982
- **Severity**: MEDIUM
- **Category**: Physicality & origin (press feedback), Cohesion & tokens
- **Estimated scope**: 3 files, about 10 changed lines

## Problem

Pill buttons only change colour when pressed. The one exception is the form submit button, which already shrinks slightly. The same-looking control therefore responds in two different ways.

```css
/* apps/web/src/components/ui/Button.astro:18-20 — current */
.primary:active { background: var(--text-link-active); color: var(--text-on-accent); }
:is(.secondary, .on-dark):active { background: var(--surface-tint); color: var(--text-link-active); }
.text:active { color: var(--text-link-active); }

/* apps/web/src/components/ui/Button.astro:26 — current (hard-coded duration, default easing) */
@media (prefers-reduced-motion: no-preference) { .action { transition: background-color 250ms, color 250ms; } }
```

```css
/* apps/web/src/components/blocks/Pricing.astro:109 and :113-115 — current */
.cta:active { background: var(--text-link-active); color: var(--text-on-accent); }
@media (prefers-reduced-motion: no-preference) {
  .cta { transition: background-color var(--motion-duration-base) var(--motion-easing-out), color var(--motion-duration-base) var(--motion-easing-out); }
}
```

```css
/* apps/web/src/components/site/Header.astro:205-208 — current (no transition at all) */
.pill-link:active {
  background: var(--text-link-active);
  color: var(--text-on-accent);
}
```

## Target

Every pill button scales to `0.97` while pressed, over `150ms` with the repo's ease-out curve. The underlined `.text` variant of `Button.astro` is a text link, not a pill, and must not scale.

```css
/* Button.astro — target */
.action:not(.text):active { scale: 0.97; }
@media (prefers-reduced-motion: no-preference) {
  .action { transition: background-color var(--motion-duration-base) var(--motion-easing-out), color var(--motion-duration-base) var(--motion-easing-out), scale var(--motion-duration-fast) var(--motion-easing-out); }
}

/* Pricing.astro — target */
.cta:active { background: var(--text-link-active); color: var(--text-on-accent); scale: 0.97; }
@media (prefers-reduced-motion: no-preference) {
  .cta { transition: background-color var(--motion-duration-base) var(--motion-easing-out), color var(--motion-duration-base) var(--motion-easing-out), scale var(--motion-duration-fast) var(--motion-easing-out); }
}

/* Header.astro — target */
.pill-link:active {
  background: var(--text-link-active);
  color: var(--text-on-accent);
  scale: 0.97;
}
@media (prefers-reduced-motion: no-preference) {
  .pill-link { transition: background-color var(--motion-duration-base) var(--motion-easing-out), scale var(--motion-duration-fast) var(--motion-easing-out); }
}
```

Token values, for reference (`apps/web/src/styles/tokens.css:139-143`): `--motion-duration-fast: 150ms`, `--motion-duration-base: 250ms`, `--motion-easing-out: cubic-bezier(0.2, 0.8, 0.2, 1)`.

## Repo conventions to follow

- Use the standalone `scale` property, not `transform: scale()`. Exemplar: `apps/web/src/components/forms/LeadForm.astro:175` (`.submit:active { scale: 0.97; }`) and its transition at `:181-183`.
- The `:active` scale is declared unconditionally. Only the `transition` sits inside `@media (prefers-reduced-motion: no-preference)`.
- Use the motion tokens, never raw milliseconds or a new cubic-bezier.
- `AGENTS.md` requires following the `good-css` skill (`.claude/skills/good-css/SKILL.md`) before editing any CSS.

## Steps

1. `apps/web/src/components/ui/Button.astro`: after line 20 (`.text:active …`), add `.action:not(.text):active { scale: 0.97; }`.
2. Same file, line 26: replace the transition with the three-property version shown in Target.
3. `apps/web/src/components/blocks/Pricing.astro:109`: append `scale: 0.97;` to `.cta:active`.
4. Same file, line 114: append `, scale var(--motion-duration-fast) var(--motion-easing-out)` to the `.cta` transition.
5. `apps/web/src/components/site/Header.astro:205-208`: add `scale: 0.97;` to `.pill-link:active`.
6. Same file: directly after that rule, add the `@media (prefers-reduced-motion: no-preference)` block for `.pill-link` shown in Target.

## Boundaries

- Do NOT touch `LeadForm.astro`; it is already correct.
- Do NOT add scale to `.nav-link`, `.logo`, `.nav-toggle`, text links, cards or FAQ summaries.
- Do NOT change markup, colours or hover rules.
- Do NOT add dependencies or new tokens.
- If a step doesn't match the code you find (drift since commit 2522982), STOP and report instead of improvising.

## Verification

- **Mechanical**: from the repo root run `pnpm --filter web check`, `pnpm --filter web test` and `pnpm --filter web build`. All three must pass with no new errors.
- **Feel check**: run the site (`verify-web` skill or `pnpm --filter web preview`) and open the home page and a page with the pricing block.
  - Press and hold a primary button, a secondary button, a pricing CTA and the header pill. Each shrinks slightly and returns on release.
  - A `.text` variant button (underlined link with an arrow) does not shrink.
  - A quick tap still shows the shrink. If it is invisible, the transition is too slow; if it looks like a jump, the transition is missing.
  - In DevTools Rendering, emulate `prefers-reduced-motion: reduce`: the button still snaps to `0.97` on press, without easing.
- **Done when**: all four pill types shrink on press, the text variant does not, and the three commands pass.

Execution evidence and compatibility limits: [verification notes](../verification-notes.md).
