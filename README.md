# zawlodzki.pl

The website of Grzegorz Zawłodzki, being migrated from Webflow to Astro + Sanity on Cloudflare Workers.
`apps/web` is the Astro site and the Worker that serves it (redirects, 404, robots headers, forms to n8n behind Turnstile).
`apps/studio` is the Sanity Studio where content is edited; a publish rebuilds the site.
`migration/` holds the plan, the task board that agents and people pick work from, the shared contracts and the verification tools.
Until cutover (task T22) `www.zawlodzki.pl` is still served by Webflow; this repo deploys the staging Worker.

## Install

Needs Node 24 (`.node-version`), pnpm 12 (`packageManager` in `package.json`) and Python 3 for the tools in `migration/tools/`.

```sh
pnpm install --frozen-lockfile
```

## Build and test

These are the commands CI runs (`.github/workflows/ci.yml`):

```sh
pnpm lint                       # ESLint, warnings allowed
pnpm check                      # astro check + Studio tsc and schema validation
pnpm test                       # web and Studio unit tests
pnpm build                      # Astro build, then the dist gate (SEO invariants, size budgets)
pnpm --filter studio build      # Studio only
python3 -I migration/tools/tasks.py check   # task board is consistent
```

## Run locally

Run the site through the real Worker, not `astro dev`, which skips redirects, the 404 page and robots headers:

```sh
export VERIFY_WEB_HOME=/tmp/verify-web
.claude/skills/verify-web/scripts/web.sh up --port 8790     # builds, starts wrangler dev --local
.claude/skills/verify-web/scripts/web.sh probe / --port 8790
.claude/skills/verify-web/scripts/web.sh down --port 8790
```

Forms need two values in the shell; use a local mock and a test key, never the real ones (see the operations guide, "Environments and trying a change on staging"). The draft-preview app has its own instructions in [`apps/web/src/preview/README.md`](apps/web/src/preview/README.md).

## Where to read next

- [`AGENTS.md`](AGENTS.md): how to pick, claim and hand off a task; the invariants that are easy to break.
- [`migration/PLAN.md`](migration/PLAN.md) (Polish): why, architecture, content model, gates and the cutover runbook.
- [`migration/lanes/platform/out/OPERATIONS.md`](migration/lanes/platform/out/OPERATIONS.md): what runs where, deploys, secrets, rollback, restore and who to call.

To find work: `python3 -I migration/tools/tasks.py ready`.
