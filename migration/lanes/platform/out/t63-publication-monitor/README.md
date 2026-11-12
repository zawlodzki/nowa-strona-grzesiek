# Publication monitor

Prepared on 2026-11-12. No production configuration or alert was sent.

## Sources and model

The [deployment endpoint](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/deployments/methods/list/)
returns the active deployment first. The monitor uses its `created_on` and `id`,
not an uploaded version or a successful build that never deployed. Required API
token permission is Account / Workers Scripts / Read, restricted to this
Cloudflare account. Do not grant Edit or use a Global API key. Account ID is a
repository variable. The endpoint does not need Workers Builds permissions.

The [Builds API](https://developers.cloudflare.com/workers/ci-cd/builds/api-reference/)
also offers build history, but its guide currently requests a user token with
Workers Builds Configuration Edit. We avoid that broader credential.
[Native build events](https://developers.cloudflare.com/workers/ci-cd/builds/event-subscriptions/)
include failed builds and can deliver through a Queue and consumer Worker to a
webhook. This is the prepared solution for build-failure notifications. It is
not a zero-configuration dashboard email toggle. The consumer must restrict
notifications to `zawlodzki-web` and `cf.workersBuilds.worker.build.failed` and
send only a fixed worker name, event type and build ID. Do not forward the full
event, author details, commit messages or error text.

The public, uncached Sanity query matches the 12 types in the rebuild hook
filter documented in `apps/web/src/preview/README.md`. It excludes drafts and
release versions and retrieves only the newest published `_updatedAt`.
No Sanity token is needed. Production is the dataset being monitored.

A pending publication becomes an alert after 20 minutes without a subsequent
deployment. This gives four times the documented five-minute publish target
for queues and transient failures. It is an initial policy, not a measured SLA.
We measure grace from publication, rather than requiring its timestamp to be
20 minutes after deployment. That literal timestamp-gap interpretation misses
publishes made seconds after a deploy forever. A 30-minute schedule normally
notices an incident in 20–50 minutes; GitHub schedules can be delayed further.

The state is `ok` or `alert`, plus a SHA-256 incident ID derived from the active
deployment ID. Further edits do not open another incident until a deploy occurs.
The workflow serializes runs and saves the incident cache only after delivery.
Dry runs neither send nor save the incident. HTTP failures fail the job and
remain retryable. No document content, IDs, titles or personal data is posted.

Cache deduplication is best effort. Cache eviction/deletion and a crash between
webhook acceptance and cache save can cause a duplicate. Strong exactly-once
requires recipient deduplication by the included incident ID. Failed requests
are not automatically retried within a run. GitHub may disable scheduled runs
in an inactive public repository; monitor Actions health separately.

This timestamp heuristic cannot detect deletes/unpublishes that leave no newer
published document, rollbacks, builds that consumed stale data, partial traffic
rollouts, or a newer publish continually resetting the grace period. Native
failure events cover failed builds, including deletion-triggered failures, but
not a lost webhook. A full deletion/lost-hook guarantee requires a durable
publication-event ledger and a build/content revision marker in another task.

## Prepared operator actions. Do not execute without approval

Questions for Grzesiek. Which destination should receive alerts (existing n8n
flow, Slack incoming webhook, or e-mail through an approved relay)? Who will
provide the account-scoped read token? A generic HTTPS JSON `{text}` receiver
is required. E-mail addresses alone are not webhook URLs. Keep both token and
webhook outside this public repository and do not paste them in the PR.

After approval, a human can enter the following commands from the checkout.
Each `gh secret set` prompts privately; never put values in shell arguments.

```sh
gh secret set PUBLICATION_MONITOR_CF_TOKEN --repo zawlodzki/nowa-strona-grzesiek
gh secret set PUBLICATION_ALERT_WEBHOOK --repo zawlodzki/nowa-strona-grzesiek
gh variable set CLOUDFLARE_ACCOUNT_ID --repo zawlodzki/nowa-strona-grzesiek --body '<account-id>'
gh variable set PUBLICATION_MONITOR_ENABLED --repo zawlodzki/nowa-strona-grzesiek --body true
gh workflow run publication-monitor.yml --repo zawlodzki/nowa-strona-grzesiek -f dry_run=true
gh run list --repo zawlodzki/nowa-strona-grzesiek --workflow publication-monitor.yml --limit 1
gh run view <run-id> --repo zawlodzki/nowa-strona-grzesiek --log
```

The workflow must be merged before dispatch. A healthy production state will
print `ok` and send nothing. To prove the message path without altering content,
prepare a synthetic alert report locally and dry-run it, then send the same
report only with explicit approval and a privately supplied environment value.

```sh
node --input-type=module -e 'import {compare} from "./migration/tools/publication-alert.mjs"; console.log(JSON.stringify(compare("2026-01-01T01:00:00Z", {id:"approved-acceptance-test",created_on:"2026-01-01T00:00:00Z"})))' > /tmp/t63-acceptance.json
node migration/tools/publication-alert.mjs send /tmp/t63-acceptance.json --dry-run
# Approval required. PUBLICATION_ALERT_WEBHOOK must already be supplied privately.
node migration/tools/publication-alert.mjs send /tmp/t63-acceptance.json
```

Record receipt at the selected destination. For real stale-content workflow
acceptance, dispatch twice with dry_run=false and verify a single alert across
the two runs, then confirm the next deployment returns `ok`. Do not manufacture
a production incident by editing content or disabling builds.

For native failures, use Cloudflare Dashboard Event Subscriptions to create a
Workers Builds failed-event subscription to a dedicated Queue and deploy the
linked documentation's notification consumer only after separate approval.
Exact account/queue/consumer names, destination and bindings must first be
chosen by Grzesiek. No queue, subscription or consumer has been created here.
Disable the scheduled monitor with the following approved operator command.

```sh
gh variable set PUBLICATION_MONITOR_ENABLED --repo zawlodzki/nowa-strona-grzesiek --body false
```

## Evidence

`check.log`, `tests.log`, `tool-tests.log` and `unit-tests.log` record local
validation. `worker-up.log`, `worker-doctor.log` and `worker-probe.log` record
the static app served through Wrangler local mode on port 8790. No visual code
changed, so a staging/new screenshot comparison does not apply.
`live-monitor.json` records the public Sanity timestamp. Cloudflare deployment
read could not run because no API token was available. Current-state `ok` is
therefore unproven, not inferred from the local app or synthetic tests.
