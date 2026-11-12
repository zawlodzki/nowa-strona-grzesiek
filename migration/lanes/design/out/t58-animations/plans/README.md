# Animation plans

Written with the `improve-animations` skill against commit `2522982`, from a read of the code only. The site was not run, so every plan carries a feel check that must be done in a browser.

Scope: `apps/web/src`. The product scenes in `components/diagrams/` and the FAQ accordion already animate and are not touched. `DESIGN.md` limits motion to scenes and state changes, and all five plans are state changes.

| # | Plan | Severity | Files | Status |
| --- | --- | --- | --- | --- |
| 001 | [Add press feedback to pill buttons](001-press-feedback-scale.md) | MEDIUM | `ui/Button.astro`, `blocks/Pricing.astro`, `site/Header.astro` | TODO |
| 002 | [Fade and slide the mobile nav panel](002-mobile-nav-open-close.md) | MEDIUM | `site/Header.astro` | TODO |
| 003 | [Scale the share popover in from its trigger](003-share-popover-entrance.md) | LOW | `post/SharePost.astro` | TODO |
| 004 | [Ease in the form error message and busy state](004-lead-form-status-and-busy.md) | MEDIUM | `forms/LeadForm.astro` | TODO |
| 005 | [Fade tab panel content and ease the selected tab](005-tabs-panel-fade.md) | LOW | `blocks/Tabs.astro` | TODO |

## Recommended order

1. **001**: smallest change, no new CSS features, removes an inconsistency.
2. **002**: highest visibility, every phone visitor who opens the menu.
3. **004**: small, on the conversion path.
4. **003**: small, blog posts only.
5. **005**: last. It is the only plan that touches script, and the only one whose result may be rejected at the feel check.

## Dependencies

- 001 and 002 both edit `site/Header.astro` (different rules: `.pill-link` and `.site-nav`). Run them one after the other, not in parallel. Line numbers in the second one will have shifted.
- 003, 004 and 005 are independent of each other and of the first two.

## Shared decisions

- **Tokens only.** `--motion-duration-fast` (150ms), `--motion-duration-base` (250ms), `--motion-easing-out` (`cubic-bezier(0.2, 0.8, 0.2, 1)`) from `apps/web/src/styles/tokens.css:139-143`. No new tokens.
- **Reduced motion.** Opacity fades stay for everyone. Movement and scale transitions sit inside `@media (prefers-reduced-motion: no-preference)`. This differs slightly from the existing code, which gates every transition including opacity (`LogoStrip.astro:44-46`). It follows the skill's rule that reduced motion means gentler, not none. The owner may prefer to gate the fades too.
- **Progressive enhancement.** Plans 002 to 005 use `@starting-style`, and 002 and 003 use `transition-behavior: allow-discrete`. Browsers without them show today's instant behaviour.
- **Open question for the executor.** Whether Astro's scoped-style compiler passes `@starting-style` through unchanged was not verified. Each plan has a step to check the built CSS.

## Before executing

This work is task T58 (`migration/tasks/T58.md`). Claim it and work on its branch, per `AGENTS.md`.
