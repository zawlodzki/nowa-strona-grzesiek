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
