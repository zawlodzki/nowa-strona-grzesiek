# T65 verification

The Worker logs each rejected form request once as JSON. The allowed fields are `form`, `branch`, `upstreamStatus`, and `requestId`. Unknown form keys become null. Request IDs are generated UUIDs, never visitor-controlled headers. Upstream bodies, exceptions, credentials, tokens, IPs, and submitted fields are excluded.

Both configs use `observability.logs.enabled=true`, `invocation_logs=false`, and `head_sampling_rate=1`. Sampling applies to requests, including explicit error logs. Keeping 100% avoids sampling out form errors. This does not override Cloudflare account quotas or retention limits.

## Sources and supported version

Read on 2026-11-12. Installed and verified Wrangler is 4.151.2. Its schema and both successful bundle dry runs support all keys below.

- [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) documents observability, invocation logs, and head sampling. The documented baseline for Workers Logs is Wrangler 3.78.6. The nested `logs.enabled`, `logs.invocation_logs`, and `logs.head_sampling_rate` keys used here are verified with 4.151.2. No claim about their first release is made.
- [Wrangler secrets configuration](https://developers.cloudflare.com/workers/wrangler/configuration/#secrets) documents `secrets.required`. Verified with 4.151.2. Deploy and versions upload validate remote required secrets and fail if missing. Local development warns for missing values. Dry runs validate bundles, not remote secret existence.

## Runs and results

- `pnpm --filter web check` passed with zero errors and warnings, one existing hint.
- `pnpm --filter web test` passed 105 tests, skipped one.
- `pnpm --filter web exec wrangler types` regenerated production bindings from required secret names.
- `pnpm --filter web exec wrangler deploy --dry-run` passed after the main build.
- `pnpm --filter web preview:build` followed by `pnpm --filter web exec wrangler deploy --dry-run --config .wrangler/preview/server/wrangler.json` passed. The source preview config intentionally leaves asset directory resolution to the Astro adapter. Direct dry-run of that source config fails because no assets directory is specified. The generated deployment config retains both observability and all five required secrets.
- `web.sh up`, `doctor`, `probe`, and `shot` ran on port 8791 through `wrangler dev --local`. The screenshot records the local page. No visible code changed, so no comparison image was needed.

`failure-logs.jsonl` contains extracted runtime records. Missing Turnstile token returned 403 with no upstream status. With the public always-pass secret, the dummy token reached the local mock and its HTTP 500 produced a 502 and an n8n record. With the public always-fail secret, the dummy token returned 403 and a Turnstile record with upstream HTTP 200. An arbitrary token with the always-pass test secret also passed Turnstile and produced an additional n8n failure, as expected for that test secret.

No production webhook was used. The mock ran on 127.0.0.1:18791 to reserve 8791 for the Worker. Synthetic payloads stayed in /tmp and were not committed.

## Repeat locally

Run `node apps/web/src/worker/form-mock-receiver.mjs --port 18791 --status 500 --out /tmp/t65-payloads.jsonl` separately. From the repository root, run the following with the helper at `.claude/skills/verify-web/scripts/web.sh`.

```sh
export VERIFY_WEB_HOME=/tmp/t65-verify
export N8N_FORM_WEBHOOK=http://127.0.0.1:18791/webhook/mock
export TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
.claude/skills/verify-web/scripts/web.sh up --port 8791
.claude/skills/verify-web/scripts/web.sh doctor --port 8791
curl -i -F email=test@example.com 'http://127.0.0.1:8791/api/form?form=main-contact'
curl -i -F email=test@example.com -F cf-turnstile-response=XXXX.DUMMY.TOKEN.XXXX 'http://127.0.0.1:8791/api/form?form=main-contact'
.claude/skills/verify-web/scripts/web.sh down --port 8791
```

For upstream Turnstile rejection, restart with public test secret `2x0000000000000000000000000000000AA` and repeat the dummy-token request. Inspect the run's `wrangler.log` before `down`. Stop the mock too.

## Follow-up

An alert needs a Cloudflare log query or Tail Worker that selects these records by branch, a time window and count or rate threshold, an authorized notification destination, and quota/retention monitoring. Alert deployment and notification setup are outside T65.

## Workflow decisions

The user required direct implementation. Delegation steps from poteto-mode were skipped. One owner kept the handler, schema, and evidence consistent. The blocking checks were board validation and dependency installation. Config and handler edits were serialized in this checkout. Model the Domain led to a typed four-field failure record. Prove It Works led to runtime POST probes, alongside allowlist tests. No new comments were added. The deslop plugin was unavailable; the diff was reviewed directly for unrelated edits and unnecessary abstractions.
