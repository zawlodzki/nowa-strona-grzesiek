---
name: verify-web
description: Launch and drive the zawlodzki.pl Astro site (apps/web) the way production serves it, through the real Cloudflare Worker under `wrangler dev`, then capture proof (HTTP status/headers, screenshots, rendered DOM, crawls). Use to prove a change to pages, routing, canonical redirects, 404 handling, robots headers or SEO output works in the running site, not only in `pnpm build`, and before filling a task's `Done when` evidence.
---

# Verify the web app

The user-facing surface is the public website in `apps/web`: Astro static output in `dist/` served by the Worker in `src/worker/index.ts` (`run_worker_first: true`). Behavior that matters for the migration lives in the Worker layer (301 canonical redirects, the 404 page, `X-Robots-Tag` on non-production hosts), and `astro dev` skips that layer. **Always verify through `wrangler dev`, never through `astro dev`.**

Other surfaces, not covered yet: Sanity Studio in `apps/studio` (placeholder until T07), the deployed staging Worker `https://zawlodzki-web.zawlodzki.workers.dev` (read-only for you, same probes work with `curl`), and the Python/Node tools in `migration/tools/`.

Everything below goes through one helper, `.claude/skills/verify-web/scripts/web.sh`. Run it from anywhere inside the checkout. It finds the repo with `git rev-parse`, so in a worktree it drives that worktree's `apps/web`.

## Setup once per checkout

```bash
pnpm install --frozen-lockfile
```

Needs Node >= 22.22 and pnpm 12. Chrome at `/Applications/Google Chrome.app` is needed only for `shot`; set `CHROME_BIN` to use another Chromium.

Set where state and evidence go. In a Claude session, use the session scratchpad. Otherwise it defaults to `$TMPDIR/verify-web`:

```bash
export VERIFY_WEB_HOME=<scratchpad>/verify-web
```

## Launch

```bash
.claude/skills/verify-web/scripts/web.sh up --port 8790
```

`up` runs `pnpm build` in `apps/web`, then starts `wrangler dev --local --ip 127.0.0.1 --port 8790 --inspector-port 0 --persist-to $VERIFY_WEB_HOME/runs/8790/state`. It returns once wrangler has logged `Ready on` **and** `GET /` answers. It prints the base URL, the run id, the git rev and the evidence directory. Startup takes about 5 seconds. The site has no database, seed data or auth yet, so an empty state dir is a complete start.

- `--no-build` reuses the current `dist/`. Use it only right after a build you ran yourself.
- If the port is taken by something this script did not start, `up` refuses. Pick another port, and never kill the other process. Ports 4321 to 4399 are often held by other sessions' `astro dev`.
- **Isolation.** Two instances can run side by side on different ports, because each has its own state dir and inspector port. They can't share one checkout's `dist/`, though, because `up` rebuilds it. Two agents in the same checkout must not run `up` at the same time. Use separate worktrees.

## Doctor

Run it first, and again whenever a result looks off:

```bash
.claude/skills/verify-web/scripts/web.sh doctor --port 8790
```

It is read-only. It checks that the wrangler pid it started is alive, that the listener on the port descends from that pid, that the instance was started at the current `HEAD` (WARN if not), that `dist/` is newer than `src/`, `public/` and `astro.config.mjs` (WARN means stale, so run `down` then `up`), and that `GET /` gives 200 with `<title>Grzegorz Zawłodzki</title>`. It exits non-zero on any FAIL. Never drive an unhealthy instance, and never drive one this script did not start.

## Drive

There are three harnesses. Pick by what the feature claims.

1. **HTTP probe** for status codes, redirects and headers. It makes one request and never follows redirects:
   ```bash
   .claude/skills/verify-web/scripts/web.sh probe /index.html --port 8790
   .claude/skills/verify-web/scripts/web.sh probe / --host www.zawlodzki.pl --label home-prod
   ```
   It prints `host  path  status  location  x-robots-tag  content-type  title` and appends the same line to `probes.tsv`. It saves `<label>.headers`, `.body` and `.status`. `--host` sends that `Host` header. The Worker reads it as `url.hostname`, so `--host www.zawlodzki.pl` exercises the production branch.
2. **Rendered page** for what a visitor sees:
   ```bash
   .claude/skills/verify-web/scripts/web.sh shot / --port 8790 --label home            # 1280 wide
   .claude/skills/verify-web/scripts/web.sh shot /nope --port 8790 --width 375          # phone
   ```
   It uses headless Chrome with a throwaway profile in the run dir and writes `<label>-w<W>.png` plus `<label>-w<W>.dom.html` (the DOM after scripts). Open the PNG with the Read tool to look at it. For interactive checks such as clicks, focus or consent banners, use the built-in browser pane: `mcp__Claude_Browser__navigate` to `http://127.0.0.1:8790/...`, then `read_page`/`find` by accessible name and role. Never use coordinates. Pane screenshots do not land on disk, so also capture a `shot` for the record.
3. **Crawl** for site-wide SEO fields. It uses the repo's own crawler:
   ```bash
   node migration/tools/crawl.mjs --origin http://127.0.0.1:8790 --out "$VERIFY_WEB_HOME/evidence/<run-id>/crawl"
   ```
   It writes `urls.csv` with status, canonical, robots, title, h1, hreflang, JSON-LD types and more for every page reachable from `/` and `/sitemap.xml`.

The per-feature recipes are in [features/README.md](features/README.md). Read the matching file before you claim a feature works.

## Evidence

Evidence goes to `$VERIFY_WEB_HOME/evidence/<run-id>/`, where run-id is `YYYYMMDD-HHMMSS-p<port>`. `up` prints the path. `down` never removes it. To cite evidence in a task's Handoff, quote the `probes.tsv` lines inline, or copy the files into a path the task `owns`. Don't write evidence into unowned tracked paths. Never paste inventory values, secrets or webhook URLs.

Proof standards:

- Go through the Worker on the real user path (`wrangler dev`, or staging). A `dist/*.html` file existing proves the build, not the URL.
- Capture the request and its result. For redirects that means status **and** `Location`. For a page it means status, title or h1, and the headers that matter (`x-robots-tag`, `content-type`).
- Check side effects alongside the visible page. Example: a "noindex" claim needs both `<meta name="robots">` in the body and the `X-Robots-Tag` header, on the host the claim is about.
- No mocks. Once forms exist (T14), the n8n webhook is a real external system: prove the request leaves the Worker, using a local stub URL given as a Worker var, never the production secret.
- Record negative probes too (404s, unchanged uppercase paths). They are part of the URL invariants.

## Cleanup

```bash
.claude/skills/verify-web/scripts/web.sh down --port 8790
```

It kills only the wrangler pid recorded at `up` and that pid's descendants (workerd). It never kills by name. It removes `$VERIFY_WEB_HOME/runs/<port>/` (logs, state, Chrome profile) and keeps `evidence/`. Run it after every attempt, failed ones too. `dist/` stays, because it is gitignored build output.

## Helpers

- `scripts/web.sh` is the only helper. It is executable, and running it with no arguments prints its usage. Its subcommands are `up`, `doctor`, `probe`, `shot` and `down`, each taking `--port` (default 8790).
