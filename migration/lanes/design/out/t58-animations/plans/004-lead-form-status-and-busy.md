# 004 — Ease in the form error message and the busy state

- **Status**: DONE — Chromium live proof at 390px and 1440px
- **Commit**: 2522982
- **Severity**: MEDIUM
- **Category**: Missed opportunity (feedback, preventing a jarring change)
- **Estimated scope**: 1 file (`apps/web/src/components/forms/LeadForm.astro`), about 12 changed lines, CSS only

## Problem

Submitting a lead form is the highest-stakes interaction on the site. Two state changes there are abrupt:

1. The error message goes from `display: none` to visible in one frame and pushes the layout.
2. The button drops to `opacity: 0.8` in one frame when the request starts.

```css
/* apps/web/src/components/forms/LeadForm.astro:176 — current */
[aria-busy="true"] .submit { cursor: progress; opacity: 0.8; }

/* LeadForm.astro:181-183 — current */
@media (prefers-reduced-motion: no-preference) {
  .submit { transition: background-color var(--motion-duration-base) var(--motion-easing-out), scale var(--motion-duration-fast) var(--motion-easing-out); }
}

/* LeadForm.astro:186-188 — current */
.status:empty { display: none; }
.status[data-state="error"] { color: var(--text-error); font-weight: var(--font-weight-medium); }
.dark .status[data-state="error"] { color: var(--text-on-dark); }
```

The script (`LeadForm.astro:54-74`) clears `status.textContent` at the start of each submit and fills it on failure, so the element toggles between `:empty` (not rendered) and rendered.

## Target

The error message fades in over `250ms` and settles down 4px. The button's busy dimming eases over `150ms`. Under reduced motion the message only fades.

```css
/* target: replaces LeadForm.astro:181-183 */
@media (prefers-reduced-motion: no-preference) {
  .submit { transition: background-color var(--motion-duration-base) var(--motion-easing-out), scale var(--motion-duration-fast) var(--motion-easing-out), opacity var(--motion-duration-fast) var(--motion-easing-out); }
}

/* target: add after LeadForm.astro:186 */
.status { transition: opacity var(--motion-duration-base) var(--motion-easing-out); }
@starting-style {
  .status:not(:empty) { opacity: 0; }
}
@media (prefers-reduced-motion: no-preference) {
  .status { transition: opacity var(--motion-duration-base) var(--motion-easing-out), translate var(--motion-duration-base) var(--motion-easing-out); }
  @starting-style {
    .status:not(:empty) { opacity: 0; translate: 0 -4px; }
  }
}
```

Token values (`apps/web/src/styles/tokens.css:139-143`): `--motion-duration-fast: 150ms`, `--motion-duration-base: 250ms`, `--motion-easing-out: cubic-bezier(0.2, 0.8, 0.2, 1)`.

There is no exit animation. The message is cleared when the user resubmits, and it should get out of the way at once.

## Repo conventions to follow

- The existing `.submit` transition in the same file (`:181-183`) is the pattern for token usage.
- Standalone `translate` property, as with `scale` at `:175`.
- Movement goes inside `@media (prefers-reduced-motion: no-preference)`. The opacity fade stays for everyone.
- `AGENTS.md` requires following the `good-css` skill (`.claude/skills/good-css/SKILL.md`) before editing any CSS.

## Steps

1. Line 182: append `, opacity var(--motion-duration-fast) var(--motion-easing-out)` to the `.submit` transition.
2. After line 186 (`.status:empty { display: none; }`), add the `.status` rules from Target.
3. Build and inspect the emitted CSS to confirm Astro's style scoping kept the `@starting-style` rules.

## Boundaries

- Do NOT touch the `<script>`, the form markup, the hidden attribution inputs, the Turnstile widget or `apps/web/src/worker/form.ts`. `AGENTS.md` lists forms as an invariant that is easy to break.
- Do NOT add a spinner or animate the button label swap.
- Do NOT change `ContactForm.astro` or `NewsletterSignup.astro`; they inherit these styles through `LeadForm`.
- Do NOT add dependencies or new tokens.
- If a step doesn't match the code you find (drift since commit 2522982), STOP and report instead of improvising.

## Verification

- **Mechanical**: from the repo root run `pnpm --filter web check`, `pnpm --filter web test` (includes `worker/form.test.mjs`) and `pnpm --filter web build`. All must pass.
- **Feel check**: run the site locally and open a page with the contact form.
  - In DevTools Network, set the connection to Offline and submit a valid form. The button dims smoothly, then the message "Brak połączenia. Sprawdź internet i spróbuj ponownie." fades in and settles from 4px above.
  - Submit again while offline: the old message disappears at once and the new one fades in again.
  - Check the dark newsletter form the same way.
  - In the DevTools Animations panel at 10% speed, confirm the message moves down into place, not up.
  - Emulate `prefers-reduced-motion: reduce`: the message fades with no movement and the button dims without easing.
  - Confirm the screen-reader behaviour is unchanged: the element keeps `role="status"` and `aria-live="polite"`.
- **Done when**: both forms show the eased error and busy state, a successful submit still redirects to the thank-you page, and the three commands pass.

Execution evidence and compatibility limits: [verification notes](../verification-notes.md).
