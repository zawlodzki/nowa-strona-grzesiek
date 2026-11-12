# T58 live verification

The local site runs through `verify-web` and `wrangler dev --local` on port 8790. Chromium compares it with the existing staging deployment at `https://zawlodzki-web.zawlodzki.workers.dev`. Both use 390×1000 and 1440×1000 viewports. No deployment was made.

## Evidence guide

`compare-*.png` puts live staging on the left and the new local Worker on the right. `frames/local-*-before.png`, `-mid.png` and `-after.png` show each state change. Midframes pause real CSS transitions halfway through their duration with the Web Animations API; they do not override opacity, position or scale. The ease-out curve is already near its endpoint at half duration. `frames/proof.json` contains computed values and actual transition keyframes. Reduced-motion captures start with `reduce-`.

`proof.mjs`, `supplement.mjs` and `compare.mjs` are the capture scripts. To repeat, install `playwright-core` and `pngjs` in a temporary directory, copy the scripts there so Node can resolve those packages, and set `T58_OUT` to this directory's absolute `frames` path for the first two scripts or to this directory for the compositor. Set the Chromium executable path in the scripts for your machine. Start the Worker with the repo helper, run doctor, run the scripts, then run down. The temporary packages are not repository dependencies.

## Plan 001

Home primary and on-dark pills, `/blog` secondary pills, `/szkolenie-i-wdrozenie-pipedrive` pricing CTAs, and the header pill were pressed and held at both widths. All scale from 1 to 0.97 and return on release. The halfway scale was 0.971618, with 150ms scale duration. The underlined text variant has no scale. On phones the header pill is tested inside the open menu. Quick press feedback is visible without a delayed start.

## Plan 002

At 390px the menu opens with 250ms opacity/translate transitions and closes with 150ms opacity/translate/display transitions. Column layout and full-width pill remain during the exit. Repeated toggles reverse cleanly; Escape closes it. A partial-opening geometry check put the panel top between 56px and 59px and the logo bottom at 52px, with no overlap. With JavaScript disabled the phone menu remains closed. At 1440px the row is visible with no transitions, including when JavaScript is disabled.

## Plan 004

Both light contact and dark newsletter forms on `/` show their real offline error through the existing submit handler. The live region remains `role=status`, `aria-live=polite`. Repeated offline submissions replace the old message. The error starts 4px above and fades over 250ms. Busy-state snapshots set only the browser's `aria-busy` state to isolate the 150ms dimming; offline failures resolve too quickly to hold the busy state reliably. They do not simulate a server success. No online form request was sent to staging or a webhook. Successful redirect behavior is covered by the unchanged Worker/form tests, not claimed as a live delivery test.

## Plan 003

On `/blog/chatgpt-work-czy-codex`, the native share popover enters from 0.97 and exits with opacity and scale over 150ms. Close button, Escape and outside-click paths were captured at both widths. It remains near full size throughout, with the existing anchor positioning and fallback origin rules intact.

## Plan 005

Sanity defines the `tabs` object in `apps/studio/schemaTypes/blocks.ts`. `lib/sanity/Sections.astro` dispatches it to `blocks/Tabs.astro`. Current built pages containing tabs are `/sales-atlas-system` and the existing `/_ds/blocks-a` catalog. The owner authorized `/sales-atlas-system` as the live feel-check target instead of the outdated home-page reference.

The full panel-fade trial pulsed during rapid pinned scrolling. In `frames/tabs-stress-full.json`, layer changes roughly 65ms apart repeatedly reduce child opacity to about 0.43 before it recovers. `frames/tabs-stress-full-*.png` and `full-fade-trial.json` preserve that rejected trial. It also generated panel opacity transitions on initial load. Therefore the final code uses the plan's allowed fallback: only the 150ms tab background/text colour transition; panel fade CSS and all three measurement script lines were removed. The final script is identical to the original.

Final checks exercise clicking, ArrowUp, ArrowDown, Home, End, slow scrolling, fast scrolling and resize. The content and card remain solid. Before/after staging comparison gives the same `--stage-size: 835px` at 1440px, with pinning enabled. At 390px and under reduced motion the section is not pinned. `frames/supplement.json` records load/resize events and slow-scroll selection; final panel opacity events must be absent. Fast-scroll frame sequences and `compare-*-tabs-switch-mid.png` show the retained colour transition.

## Reduced motion

The implementation follows the plans' choice: opacity fades remain, movement and scale easing require `no-preference`. With `reduce` emulated at both widths, nav and status translate are `none`, share scale is `none`, and press scale snaps to 0.97 without an animation. Both form tones dim instantly to 0.8, with transition duration 0s and no animations. Tab colours snap and the tabs are not pinned. The final tabs no longer fade in either preference.

## Checks and limits

- Board check passed before work and before PR preparation, with 58 tasks and 0 problems.
- `pnpm --filter web check`: 0 errors, 0 warnings, 1 existing hint.
- `pnpm --filter web test`: 95 pass, 0 fail, 1 skipped.
- `pnpm --filter web build`: 117 pages.
- Worker doctor passed. `/sales-atlas-system` returned 200, `noindex, nofollow`, and its expected title.
- `built-css-starting-style.txt` records emitted scoped starting-style selectors for nav, status and popover. Tabs starting-style is intentionally absent from the final code.
- Forms changed only inside their style block. No tokens, markup, scripts, hidden inputs or Worker source changed.
- Shared preview failed because host AppArmor blocks its sandbox. The repo's screenshot helper and Playwright-driven Chromium worked.
- Real Safari and a browser lacking starting-style/anchor positioning were unavailable. Their compatibility checks remain a reviewer follow-up; no Safari pass is claimed.

## Work organization

The board check and plan/source comparison came first. A single owner implemented the ordered plans, as requested; independent agent workstreams were not used. Header edits were serialized, and forms stayed within styles. The Prove It Works principle changed the plan 005 decision: observed opacity pulsing led to the allowed colour-only fallback.

Final artifact assertions passed: every state and comparison exists at both widths; reduced-motion captures have no movement/scale transitions; tab load/resize has no content-opacity transition.
