# T48 verification

Shared template refinement, implemented without delegation. Only the task's owned paths changed.

## Decisions

The domain has two independent states: TOC disclosure (native `details.open`, synchronized to the side-layout media query) and related-list visibility (one inert state, derived from the article midpoint crossing the viewport midpoint). Brand icons remain in the existing share-options registry.

Poteto checkpoint: board checks and instruction reads first; one implementation stream because the template and TOC breakpoints must agree; shared state is limited to the DOM disclosure/inert attributes; one author performs implementation and browser review as explicitly requested. Model the Domain kept visibility derived rather than adding competing booleans. Prove It Works required Worker/browser measurements beyond the build.

## Reproduce

Run `.claude/skills/verify-web/scripts/web.sh up --port 8790`, then `doctor --port 8790`. Run `node migration/lanes/design/out/t48-blog-layout/verify.cjs`, then `web.sh down --port 8790`. The script uses the existing temporary Playwright installation at `/tmp/t31-browser/node_modules/playwright-core`; adjust that import if needed. No Astro development server.

`measurements.json` records geometry, overflow, disclosure state, related-list visibility in both directions, reduced-motion computed styles, equal tile sizes, and browser exceptions. `layout-*` shows the article grid at 1440, 1100, 900 and 390px. `toc-expanded-390.png` complements the collapsed `layout-390.png`. `share-*` shows the six tiles. `related-*` shows before/after/back with normal and reduced motion. `compare-*` pairs live and local captures.

At 1440px the TOC and header start at x=120. At 1100 and 900px the right-column content moves below the article, preserving related links while removing the duplicate CTA. At 390px the TOC is collapsed, the sidebar CTA is hidden, and the bottom CTA remains. CTA wording is unchanged. Existing editorial images are unchanged.

Brand paths: Simple Icons v11 (X, LinkedIn, Facebook, WhatsApp), fetched from its published SVGs. Email and copy retain conventional stroke icons. No icon dependency added.

## Animation review (Emil Kowalski review-animations)

Read `skills/animate/SKILL.md`, `skills/emil-design-eng/SKILL.md`, and `skills/review-animations/SKILL.md` from a shallow temporary checkout of https://github.com/emilkowalski/skills at `/tmp/t48-emil-skills`. No skill installation into the repository.

| Before | After | Why |
| --- | --- | --- |
| Related list always visible | Midpoint-derived inert/aria-hidden state | Reveal related reading after engagement; hidden links cannot receive focus |
| Abrupt visibility change | 240ms opacity + 8px transform with cubic-bezier(0.23,1,0.32,1) | Occasional state indication, short and interruptible in both directions |
| Initial visible flash possible | Initial inert markup | Hidden before the first browser update |
| Motion preference | Instant show/hide with no transform | User requirement overrides the skill's default reduced fade |

Verdict: approve. Only transform and opacity animate; the list keeps its layout space, so article geometry does not shift. No keyframes, layout animation, library, hover motion, or stagger. The list is one reveal unit. CSS transitions retarget if scroll direction reverses. Screenshots and computed-state checks cover both scroll directions; reduced-motion rectangles are identical across states.

## Environment limitations

Shared T3 browser automation failed because the host's AppArmor policy blocks its sandbox. Used existing headless Playwright instead. First capture attempt timed out on network-idle; the final harness uses DOM readiness, font readiness and a bounded asset wait. No external systems were written.

No Skill invocation tool is exposed. Local skills were read directly, with review performed in-session to honor the no-delegation instruction. Astro check passes with zero errors and warnings, plus one existing hint in src/preview/worker.ts. The Impeccable detector returns an empty findings list.
