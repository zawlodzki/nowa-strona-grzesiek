# T39 post verification

`compare-<post>-<state>-<width>.png` shows live on the left and the local Worker on the right. The two posts are `asana-vs-jira` and `asana-vs-trello`. Widths are 1440, 768 and 375 CSS pixels. States cover hero, article top, mid-scroll, author (`bottom`), CTA, FAQ, right sidebar and the open share panel. Live has no share control, so that comparison retains its previous article position. At mobile widths the sidebar appears after the body. These are comparisons of the requested refinement, not assertions of identical pixels.

`baseline-*` records the original live, staging and reference pages before implementation. `regression-*` records home and blog at all three widths. No home or blog-index source was changed.

`verification.json` records assertions against the local Worker. It covers actual TOC targets, three related links, author/CTA/FAQ order, uncropped author image styling, sticky positions at two scroll offsets, static columns at tablet/mobile widths, overflow, keyboard share opening, clipboard contents, Escape and restored focus. CMS editorial order, language filtering, missing/self references, duplicate removal and newest-post fallback are tested in `apps/web/src/components/post/related.test.ts`.

The final verify-web run was `20261111-151706-p8791`. Doctor was healthy. `probes.tsv` records both posts, home and blog returning 200, and uppercase returning 404. All responses use the real Worker. The six `web.sh shot` PNG/DOM pairs remain in `/tmp/verify-t39/evidence/20261111-151706-p8791/` on the task machine. The committed comparison images use the same Worker and add interactive and scroll states through Chromium.

To repeat, install the repository dependencies and install `playwright-core` in a scratch directory, then run from the repository root. Set `PLAYWRIGHT_MODULE` to that installation's absolute `index.mjs` path. Set `CHROME_BIN` to a Chromium executable. On this machine it was `/opt/agent-vm/chromium/chrome`.

```sh
export VERIFY_WEB_HOME=/tmp/verify-t39
.claude/skills/verify-web/scripts/web.sh up --port 8791
.claude/skills/verify-web/scripts/web.sh doctor --port 8791
node migration/lanes/design/out/t39-post/verify.mjs
.claude/skills/verify-web/scripts/web.sh down --port 8791
```

Use `web.sh probe` and `web.sh shot` for the two post paths at each width. Always run `down`, including after a failed assertion. The browser script closes Chromium in `finally`. No external writes or production Sanity patches are needed because the optional CMS field has a runtime fallback.

## Review changes on 2026-11-11

The `review-*.png` files and `review-verification.json` supersede the original portrait and TOC evidence. The author now uses an 80px circular crop with `object-fit: cover`. The share trigger includes an inline decorative SVG. `PostToc` renders real nested lists and marks the current heading with `aria-current="location"`. Slug anchors are on the actual h2/h3 elements. A passive, animation-frame-throttled scroll listener updates the active link in either scroll direction. Links and nested structure work without JavaScript.

Review proof used port 8790 after `lsof` confirmed it was free. Port 8791 was occupied by another task and was untouched. verify-web run `20261111-154824-p8790` passed doctor, both HTTP probes and desktop/mobile shots. `review-verify.mjs` exercised the built Worker at 1440 and 375px and captured icon, active TOC and round-avatar states. Repeat it with `VERIFY_ORIGIN=http://127.0.0.1:8790`, `PLAYWRIGHT_MODULE` and `CHROME_BIN` configured as above. Its `finally` closes Chromium; run verify-web `down --port 8790` after each attempt.

The published Asana/Jira body contains eight h2 headings and no h3. Its screenshots therefore show the actual h2 outline. The additional `/blog/asana-cennik` screenshots prove all three existing h3 headings appear under their h2, target actual h3 elements and become active on scroll. No production content was changed to manufacture a nested outline on Asana/Jira.

`outline.test.ts` verifies nesting, Polish slug normalization, duplicate titles, stable IDs after unrelated insertion, orphan h3 handling and bodies without headings. Web tests passed 86 with one existing skip; Astro check and TypeScript passed. The Worker was stopped with verify-web `down` after successful proof.
