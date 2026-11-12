# Separate static Worker environments

Proposed on 2026-11-12. Grzesiek approved START only. Environment approval is pending. No Worker, Builds setting, webhook, secret, domain, DNS, GSC or deployment was changed during this task. Only local execution and dry-run deployment took place.

## Environment choices

The configuration shape is an `env` map with explicit names, routes, asset bindings, and required secret names. Shared runtime code still decides indexing by hostname.

| Setting | Staging | Production |
| --- | --- | --- |
| Wrangler environment | staging | production |
| Worker | zawlodzki-web, keeps existing name | zawlodzki-web-production, proposed new Worker |
| workers_dev | true | false |
| preview_urls | false | false |
| Active custom domains | none | none until T22 |
| Build trigger | main push and existing Sanity publish hook | manual promotion after staging acceptance |
| Runtime secrets | N8N_FORM_WEBHOOK, TURNSTILE_SECRET_KEY | N8N_FORM_WEBHOOK, TURNSTILE_SECRET_KEY |

The top-level configuration keeps the existing staging identity for the current bare Workers Builds deploy command and the verify-web helper. Named deploy scripts always select an environment. This avoids changing the existing external build configuration as a side effect of merging this PR.

Production has no public address before T22. Requiring a live production address now conflicts with keeping workers.dev disabled and leaving apex and www untouched. Do not claim the deployed acceptance item passes. If a temporary new production test domain is wanted, obtain approval and prepare it in a follow-up. No such domain is active in this proposal.

The existing `zawlodzki-web-preview` SSR application is separate and unchanged. It is not either static environment.

## Build and promotion policy

After approval, keep the staging Workers Builds repository root at the repository root, its branch at `main`, its build command at `pnpm --filter web build`, and set its deploy command to `pnpm --filter web exec wrangler deploy --env staging`. Keep preview branch builds disabled and NODE_VERSION=24. The dashboard's term "production branch" means main for this staging Worker. It does not select the Wrangler production environment.

Do not connect production to automatic main builds. Check out the exact staging-tested commit in a clean checkout, install with `pnpm install --frozen-lockfile`, run `pnpm check`, `pnpm test`, and `pnpm --filter web build`, then dry-run production. Record the commit, chosen dataset, staging build ID, and content acceptance before asking approval for promotion. Run the production script only after approval. Because Sanity content is mutable, the same commit alone does not guarantee identical HTML. Pause content edits during promotion and compare the staging and production crawls at T22.

Keep the current Sanity publish webhook targeting the staging Builds hook. Do not create or move a production hook. Published content therefore requires a manually approved production rebuild too. This is an intentional tradeoff that Grzesiek must accept or revise. Draft preview continues reading drafts without a static rebuild.

Use the same chosen published Sanity dataset for both static builds. Record its actual value privately at activation. Runtime form secrets are separate per Worker and are not inherited. Staging must use test-only Turnstile and an approved non-production n8n destination. Never copy production secret values to evidence. Production needs its actual form destination and matching Turnstile secret. Neither static Worker needs a draft-read token or preview Basic Auth secrets.

## Commands prepared for the owner

These commands are NOT executed by T66. Each external action needs its own explicit approval. Commands run from the repository root. Do not run deploy commands merely because this PR merges.

After approval to configure each secret on its target Worker, enter its value interactively through the secure operator environment. Never place it in shell arguments or tracked files.

```sh
pnpm --filter web exec wrangler secret put N8N_FORM_WEBHOOK --env staging
pnpm --filter web exec wrangler secret put TURNSTILE_SECRET_KEY --env staging
pnpm --filter web exec wrangler secret put N8N_FORM_WEBHOOK --env production
pnpm --filter web exec wrangler secret put TURNSTILE_SECRET_KEY --env production
```

`secret put` can create a missing Worker. Approval must cover that creation before the production commands run. Confirm selected account and existing secret inventory privately first.

After separate approval for each deploy, the prepared commands are:

```sh
pnpm --filter web deploy:staging
pnpm --filter web deploy:production
```

The production command currently attaches no domains. Before executing it, confirm routes are still empty. Workers Builds changes have no repository CLI wrapper. Prepare them in Cloudflare Dashboard > Workers & Pages > zawlodzki-web > Settings > Builds using the exact staging settings above, then ask approval before saving. No production Builds connection or hook is proposed. No Sanity webhook change command is needed because its target stays staging. If a hook must be replaced, ask separately before creating it and again before changing Sanity's target. Store the URL only in the external secret configuration.

T22 alone replaces production `routes: []` with the two commented custom-domain entries in wrangler.jsonc. It then requests fresh cutover approval before `pnpm --filter web deploy:production`. That command can attach both domains and change their routing. This task does not authorize it. DNSSEC, existing records, apex, www and GSC remain outside T66 execution.

After activation, fetch staging and production, verify `X-Robots-Tag` is `noindex, nofollow` on staging and absent on www, and test an approved publish plus a referenced dependency through the staging webhook. Record build IDs, timestamps and content. Production acceptance, form delivery, and the Sanity rebuild remain untested here.

## Local verification

`check.log` and `tests.log` record `pnpm check` and `pnpm test`. Both dry-run logs show successful packaging with ASSETS. `up.log`, `doctor.log`, `probes.tsv`, response headers and `home-w1280.png` prove the actual local Worker on port 8790 using verify-web. The helper uses top-level staging configuration. Named environments are verified by dry-run, not by a deployed endpoint.

The staging Host request returned 200 with `noindex, nofollow`. The www Host request returned 200 without that header. Uppercase `/NOPE` returned 404. Host headers exercise the existing production-host branch without contacting production. `apps/web/src/worker/index.ts` was inspected and not edited. The helper was stopped with `web.sh down --port 8790`.

## Sources checked on 2026-11-12

- [Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/) documents environment selection and separate bindings and secrets.
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) documents using `--env staging` in the deploy command.
- [Build branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/) documents the configured branch triggering a build and deployment. Preview builds are a separate setting.

Model the Domain led to explicit entries in the environment map. Prove It Works led to local HTTP probes through workerd instead of treating the Astro build as runtime proof.
