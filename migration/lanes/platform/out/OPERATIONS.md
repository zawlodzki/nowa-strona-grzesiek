# Operations guide

How zawlodzki.pl is built, deployed and repaired. State checked on 2026-11-12 (T70). Run every command from the repository root unless it says otherwise.

**Owner-only** marks a step that needs Grzesiek's access or his explicit yes at that moment (see "Who to call"). Agents never run those on their own. Secret values, webhook URLs and account ids never go into this repo, a PR, a log you paste, or a screenshot.

## Where things run today

| Piece | Where | Notes |
|---|---|---|
| Public site `www.zawlodzki.pl` | **Still Webflow** | Moves to the Worker only at cutover (T22). Until then nothing in this repo changes what visitors see on www. |
| Static site, staging | Cloudflare Worker `zawlodzki-web` at `https://zawlodzki-web.zawlodzki.workers.dev` | Astro static build + `apps/web/src/worker/index.ts`. Sends `X-Robots-Tag: noindex, nofollow` on every non-production host. Config: `apps/web/wrangler.jsonc`, env `staging` (the top level is the same Worker). |
| Static site, production | Cloudflare Worker `zawlodzki-web-production` | Declared in `wrangler.jsonc` env `production` with `routes: []` and `workers_dev: false`. **Not created yet** (T66 merged, creation waits for owner yes). T22 alone adds the www and apex custom domains. |
| Draft preview | Cloudflare Worker `zawlodzki-web-preview` at `https://preview.zawlodzki.pl` | SSR app, Basic Auth or Studio session, always `noindex`. Config: `apps/web/wrangler.preview.jsonc`. Docs: [`apps/web/src/preview/README.md`](../../../../apps/web/src/preview/README.md). |
| Sanity Studio | `https://zawlodzki.sanity.studio` | Source `apps/studio`. Project id and dataset in `apps/studio/sanity.cli.ts`; the site reads dataset `production`. A second dataset `development` exists. |
| Forms | Worker route `/api/form` → Turnstile check → n8n webhook | Code `apps/web/src/worker/form.ts`. The n8n instance and its workflow are outside this repo; owner-only. |
| Consent | self-hosted c15t at `consent.zawlodzki.com` | Loader `/assets/cmp-v1.js`, backend allow-list of origins. Outside this repo; owner-only. See `migration/lanes/tracking/out/c15t-origins.md`. |
| DNS | Cloudflare (nameservers moved from OVH) | Apex and www still point at Webflow. Any DNS change is owner-only (AGENTS.md). Runbook: `migration/PLAN.md` section 8. |
| CI and automation | GitHub Actions in `.github/workflows/` | `ci.yml` (required `build` check), `deploy-studio.yml`, `publication-monitor.yml`. |

Quick health check of what is public:

```sh
for u in https://zawlodzki-web.zawlodzki.workers.dev/ https://preview.zawlodzki.pl/ https://zawlodzki.sanity.studio/; do
  curl -s -o /dev/null -w "%{http_code} %header{x-robots-tag} $u\n" -m 15 "$u"
done
```

Expected: staging `200 noindex, nofollow`, preview `401 noindex, nofollow, noarchive`, Studio `302` (login redirect).

## How a change reaches the site

**Code.** Branch → PR → CI `build` must pass on an up-to-date branch → Grzesiek merges (agents never merge; `main` blocks force-push and deletion). Then, on `main`:

- Cloudflare Workers Builds (connected to this repo, branch `main`, build `pnpm --filter web build`, `NODE_VERSION=24`) builds and deploys the staging Worker `zawlodzki-web`. The build fails if `migration/tools/check-dist.mjs` finds an SEO or size-budget problem in `dist/`.
- `deploy-studio.yml` runs after a green CI push on `main` and deploys Studio and its schema with `sanity deploy` (active: `STUDIO_DEPLOY_ENABLED=true`). It skips commits that are no longer the tip of `main`.
- Production Worker: promoted by hand, owner-only, after staging is accepted: `pnpm --filter web deploy:production` from a clean checkout of the tested commit. Before T22 it has no public address.

Check the latest Studio deploys:

```sh
gh run list --workflow deploy-studio.yml --limit 5
```

**Content.** Editor publishes in Studio → Sanity GROQ webhook (published documents of the 12 page-building types; drafts and release versions ignored) → Workers Builds deploy hook → fresh build of `zawlodzki-web` from `main` reading `api.sanity.io` → deploy. Target: live within 5 minutes. Drafts never trigger a build; preview reads them live. Production gets content only through the manual promotion above. Filter and details: `apps/web/src/preview/README.md`, section "Published-content rebuild hook".

## Secrets: names and where they live

Values live only in the place listed. To change one, the owner sets it interactively (the commands prompt for the value; never pass a value as an argument).

| Name | Used by | Set in | How (owner-only) |
|---|---|---|---|
| `N8N_FORM_WEBHOOK` | Workers `zawlodzki-web`, `zawlodzki-web-production`, `zawlodzki-web-preview` | Cloudflare Worker secrets, per Worker | `pnpm --filter web exec wrangler secret put N8N_FORM_WEBHOOK --env staging` (or `--env production`; preview: `--config wrangler.preview.jsonc`) |
| `TURNSTILE_SECRET_KEY` | same three Workers | Cloudflare Worker secrets | as above |
| `SANITY_API_READ_TOKEN` | `zawlodzki-web-preview` | Cloudflare Worker secrets | `wrangler secret put … --config wrangler.preview.jsonc` in `apps/web` |
| `PREVIEW_AUTH_USER`, `PREVIEW_AUTH_PASSWORD` | `zawlodzki-web-preview` | Cloudflare Worker secrets | as above. Rotating the password ends editor sessions. |
| `SANITY_AUTH_TOKEN` | `deploy-studio.yml` | GitHub Actions secret | `gh secret set SANITY_AUTH_TOKEN` |
| `PUBLICATION_MONITOR_CF_TOKEN` | `publication-monitor.yml` (Workers Scripts Read) | GitHub Actions secret | `gh secret set PUBLICATION_MONITOR_CF_TOKEN` |
| `PUBLICATION_ALERT_WEBHOOK` | `publication-monitor.yml` (alert destination) | GitHub Actions secret | `gh secret set PUBLICATION_ALERT_WEBHOOK` |
| `SANITY_BACKUP_READ_TOKEN`, `SANITY_BACKUP_B2_KEY_ID`, `SANITY_BACKUP_B2_KEY`, `SANITY_BACKUP_B2_BUCKET`, `SANITY_BACKUP_RESTIC_PASSWORD` | scheduled backup workflow from T73 (not on `main` yet) | GitHub Actions secrets | `gh secret set <NAME>`. The Restic password also lives in 1Password. |
| Workers Builds API token | Workers Builds for `zawlodzki-web` (Workers Scripts Edit) | Cloudflare dashboard → Workers & Pages → `zawlodzki-web` → Settings → Builds | dashboard only |
| Workers Builds deploy hook URL | Sanity webhook | Sanity Manage → API → Webhooks | treat the URL as a secret |

Non-secret settings: repository variables `CLOUDFLARE_ACCOUNT_ID`, `PUBLICATION_MONITOR_ENABLED`, `STUDIO_DEPLOY_ENABLED`; preview vars `SANITY_DATASET` and `SANITY_STUDIO_URL` in `wrangler.preview.jsonc`. Both Worker configs declare their secrets under `secrets.required`, so a deploy fails if one is missing.

List what is set (names only):

```sh
gh secret list --repo zawlodzki/nowa-strona-grzesiek
pnpm --filter web exec wrangler secret list --env staging   # needs a Cloudflare login
```

For local runs, keep values out of the repo: export them in the shell (as in "Try a change on staging") or use `--env-file` with a file outside the checkout. `apps/web/.dev.vars.example` lists the names. Do not create `apps/web/.dev.vars`: `.gitignore` does not cover it today.

## A publish did not appear

Look first at the **Workers Builds history for `zawlodzki-web`** (Cloudflare dashboard → Workers & Pages → `zawlodzki-web` → Deployments / Builds). Then:

1. No build started at the publish time: the webhook did not fire. Open Sanity Manage → API → Webhooks → the rebuild hook → attempts log. A draft edit or a release version never triggers it, by design.
2. Build failed: open its log. A `check-dist` FAIL names the page and the rule. Fix in a PR; the merge rebuilds.
3. Build succeeded but the content is old: search the build log for the generated route. A second publish while a build is queued is folded into that build; publish again or re-run.
4. Re-run (owner-only): Builds → the latest build → Retry, or publish the document again.

The publication monitor (T63, active: `PUBLICATION_MONITOR_ENABLED=true`) runs at :17 and :47 every hour. It compares the newest published `_updatedAt` of those 12 types with the active deployment of `zawlodzki-web`. `ok` means a deploy happened after the last publish (or the publish is under 20 minutes old). `alert` means a publish older than 20 minutes has no later deploy; it posts one message per incident to the alert destination. It cannot see deletes, a lost hook after a later publish, or a build that deployed stale data. Read its last result:

```sh
gh run list --workflow publication-monitor.yml --limit 5
gh run view <run-id> --log | grep '"status"'
```

Runbook, dry-run and disable command: `migration/lanes/platform/out/t63-publication-monitor/README.md`.

## The form is losing leads

Look first at the **Worker's logs**: Cloudflare dashboard → Workers & Pages → the Worker (`zawlodzki-web` now, `zawlodzki-web-production` after cutover) → Observability → Logs, filtered on `branch`. Each rejected submission writes exactly one JSON line with four fields and no visitor data:

```json
{"form":"main-contact","branch":"n8n","upstreamStatus":500,"requestId":"…"}
```

| `branch` | Visitor saw | Meaning | Do |
|---|---|---|---|
| `turnstile`, `upstreamStatus` `null` | 403 | No Turnstile token, or Cloudflare could not be reached | Check the widget renders and consent did not block it. Many in a burst = bots. |
| `turnstile`, `upstreamStatus` `200` | 403 | Cloudflare rejected the token | Site key and `TURNSTILE_SECRET_KEY` don't match on this Worker, or the token expired. |
| `n8n`, a number | 502 | n8n answered with that HTTP status | **The lead is lost.** Check the n8n workflow is active and its executions. |
| `n8n`, `null` | 502 | n8n unreachable, or `N8N_FORM_WEBHOOK` wrong | **The lead is lost.** Check n8n is up, then the secret (owner-only). |
| `bad-request`, `form` `null` | 404 | Unknown `?form=` key | A page posts to a form key that `form.ts` does not know. |
| `bad-request`, a form key | 400 / 405 | Wrong method, malformed body or invalid e-mail | Usually the visitor; many in a row means a broken page. |

A successful submission logs nothing and redirects (303) to the thank-you page. There is no alert on these lines yet (T65 follow-up). Stream them live (owner-only, needs a Cloudflare login):

```sh
pnpm --filter web exec wrangler tail --env staging --format json --search '"branch"'
```

Reproduce each line locally with the mock receiver: `migration/lanes/platform/out/t65-observability/README.md`, section "Repeat locally".

## Roll back a bad deploy

Look first at the Worker's **Deployments** list (dashboard, or `wrangler deployments list --env staging`). Every deploy is a version that bundles code and static assets, and the last 100 can be rolled back to. A rollback does not change secrets or bindings.

Owner-only, needs a Cloudflare login:

```sh
pnpm --filter web exec wrangler deployments list --env staging
pnpm --filter web exec wrangler rollback <version-id> --env staging -m "reason"
```

Use `--env production` after cutover. `wrangler rollback` has no dry run. Dashboard alternative: the Worker → Deployments → ⋯ on the good version → Rollback.

The next merge to `main` or the next content publish deploys again from `main`, so also fix `main`: revert the bad PR in a new PR (`git revert <merge-sha>` on a branch). To check that a previous commit still builds and packages before redeploying it:

```sh
git switch --detach <good-sha>
pnpm install --frozen-lockfile
pnpm --filter web build
pnpm --filter web exec wrangler deploy --env staging --dry-run
```

After T22, if the new site itself must go: re-point www and apex to Webflow in Cloudflare DNS (owner-only, `migration/PLAN.md` section 8 step 8). The Webflow plan stays active for at least 14 days after cutover for this.

## Restore content

Sanity content backups and the restore procedure: [`migration/lanes/cms/out/backup/RESTORE.md`](../../cms/out/backup/RESTORE.md). Export with `node migration/tools/backup-sanity.mjs`; encrypted copies with object lock are in the private Backblaze B2 bucket. Restore always goes into a fresh dataset first; writing to `production` is owner-only. The project's dataset quota is full (a restore drill got HTTP 402), so a scratch dataset may need another project. The weekly scheduled backup is T73 and not on `main` yet.

## Environments and trying a change on staging

| Environment | Worker | Gets deploys from | Indexing |
|---|---|---|---|
| local | `wrangler dev --local` | your checkout | `noindex` (non-production host) |
| staging | `zawlodzki-web` | every `main` build and every content publish | `noindex` |
| production | `zawlodzki-web-production` | manual promotion, owner-only | indexed on `www.zawlodzki.pl` only |
| preview | `zawlodzki-web-preview` | owner deploy, see preview README | `noindex`, behind auth |

There are no per-branch preview builds. To try a change before it reaches staging, run the real Worker locally (never `astro dev`, which skips redirects, 404 handling and robots headers). The helper builds `apps/web`, starts `wrangler dev --local`, and saves probes and screenshots under `$VERIFY_WEB_HOME`:

```sh
export VERIFY_WEB_HOME=/tmp/verify-web
export N8N_FORM_WEBHOOK=http://127.0.0.1:18791/webhook/mock   # local mock, never the real one
export TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA  # Cloudflare's public always-pass test key
.claude/skills/verify-web/scripts/web.sh up --port 8790
.claude/skills/verify-web/scripts/web.sh doctor --port 8790
.claude/skills/verify-web/scripts/web.sh probe / --port 8790
.claude/skills/verify-web/scripts/web.sh probe / --port 8790 --host www.zawlodzki.pl
.claude/skills/verify-web/scripts/web.sh down --port 8790
```

The second probe sends the production `Host`, so it exercises the production branch (no `X-Robots-Tag`) without touching production. Merging the PR puts the change on staging; check it there with the health check above. More recipes: `.claude/skills/verify-web/SKILL.md`. Environment design and the promotion policy: `migration/lanes/platform/out/t66-environments/proposal.md`.

## Who to call

| For | Who | Has access to |
|---|---|---|
| Anything owner-only above: merges, secrets, Cloudflare (Workers, Builds, DNS), Sanity Manage and the `production` dataset, GitHub settings | Grzesiek, repo owner ([@zawlodzki](https://github.com/zawlodzki)) | everything |
| n8n workflow and lead delivery | Grzesiek | the n8n instance |
| Consent backend (c15t allow-list) | Grzesiek, or whoever runs `consent.zawlodzki.com` for him | the c15t deployment |
| Platform outage | [Cloudflare status](https://www.cloudflarestatus.com/), [Sanity status](https://www.sanity-status.com/), [GitHub status](https://www.githubstatus.com/) | public |

Agents: open a PR or write the problem under the task's Handoff; never change an external system to "fix" an incident without Grzesiek's yes at that moment.
