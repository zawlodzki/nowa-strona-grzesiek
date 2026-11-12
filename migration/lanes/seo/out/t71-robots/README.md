# T71 verification

Run on 2026-11-12 in the T71 worktree. Only local Wrangler was used, on port 8791.

- `node --test apps/web/src/worker/robots.test.ts apps/web/src/pages/sitemap/_render.test.mjs` passed all 17 tests. See `unit-tests.txt`.
- `VERIFY_WEB_HOME=/tmp/verify-web-t71 .claude/skills/verify-web/scripts/web.sh up --port 8791` built the app successfully. The execution harness ended that background process after the command returned. The next doctor detected it as unhealthy; no successful probes were taken against it.
- Restarted with `up --port 8791 --no-build`, reusing that build, then ran doctor and both probes in the same execution lifetime. `doctor.txt` records the healthy instance.
- `probe /robots.txt --port 8791 --label robots-local` returned 200, text/plain UTF-8, Disallow-all, no Sitemap, and noindex/nofollow.
- `probe /robots.txt --port 8791 --host www.zawlodzki.pl --label robots-prod` returned 200, text/plain UTF-8, Allow-all, the production sitemap URL, no Disallow rules and no X-Robots-Tag.
- Raw headers, bodies, status files and `probes.tsv` are adjacent. An EXIT trap ran `down --port 8791` after both attempts. No Worker was left running.
- `python3 -I migration/tools/tasks.py check` passed before implementation and before opening the PR.

The Worker reads the request URL hostname. Wrangler maps the incoming Host header to that URL. Unit tests exercise the Worker with the corresponding request URL and Host; live probes prove Wrangler's mapping.
