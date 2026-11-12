# Run IndexNow after a production deploy

Submission is disabled. No dashboard command, runtime variable, or production service was changed by T72.

The public key lives once in `apps/web/src/lib/indexnow.mjs`. Astro generates `/<key>.txt` using `[indexnow].txt.ts`. The route does not feed sitemap discovery. The owns entry changed from `indexnow.txt.ts` because the verification URL must contain the actual key.

## Change set

Every successful Astro production build regenerates the whole static site. Submit all indexable page URLs from that build's `dist/sitemap.xml` children, deduplicated and sorted. This intentionally resubmits unchanged pages. No last-success state or persistence is needed; a later deploy retries the complete set after a failure. Deleted/noindex URLs and T59 Markdown representations are excluded. More than 10000 URLs fails before HTTP; introduce batching if the site reaches that size.

The script reads local build artifacts, never fetches a production sitemap. Run from any directory with Node >=22.22. A dry run ignores enable guards, prints the payload, and makes no HTTP requests:

```sh
node migration/tools/indexnow.mjs --dry-run
```

## Enable only after merge and the user's explicit "tak"

First ensure production has cut over to this Worker, and verify the public key URL returns the exact configured key. In the production Workers Builds settings only, set `INDEXNOW_ENABLED=1`. Append this exact command to the existing successful production deploy command, using `&&`:

```sh
&& INDEXNOW_DEPLOYMENT=production INDEXNOW_HOST=www.zawlodzki.pl node migration/tools/indexnow.mjs
```

The complete future command is:

```sh
pnpm --filter web build && pnpm --filter web exec wrangler deploy && INDEXNOW_DEPLOYMENT=production INDEXNOW_HOST=www.zawlodzki.pl node migration/tools/indexnow.mjs
```

Do not apply these steps now. Do not set the flag in runtime Wrangler vars, local files, GitHub Actions, staging, or preview builds. Cloudflare supplies `WORKERS_CI=1` and `WORKERS_CI_BRANCH`; the script requires main. These are deployment guardrails, not credentials or cryptographic proof of the execution environment. Do not spoof them locally. See [Cloudflare build variables](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

The POST goes only to the fixed HTTPS IndexNow endpoint, rejects redirects, times out after 15 seconds, and accepts only 200/202. Failure exits nonzero without retrying. Disable by removing the enable flag from the production build settings. T66 must retain this hook only on the production deploy path when splitting environments.

## Verification

`tests.txt` records four passing tests: configured key body, sitemap fixture and dry run, unsafe environment refusals before fetch, and a recording localhost HTTP mock with success/failure responses. Only the test injects transport; the CLI has no endpoint override.

`doctor.txt`, `probes.tsv`, and HTTP captures come from verify-web on port 8790 with `wrangler dev --local`. Local and simulated production Host both return 200 and the exact key with the expected plain-text header. The wrong key path returns 404. The live sitemap excludes the key. `dry-run.json` contains the actual build payload. `check.txt` records `pnpm check`. The Worker was stopped with `web.sh down` after probing. No IndexNow network request was made.
