# T19 verification

Verified locally on 2026-10-22 and rechecked on 2026-10-23. Deployment and publishing were not performed.

## Running Worker

Build with `pnpm --filter web preview:build`. Start the generated Worker as described in README.md. Run `PREVIEW_ENV_FILE=<local-file> PREVIEW_ORIGIN=http://127.0.0.1:8793 node apps/web/src/preview/verify-running.mjs`. The local environment file contains server credentials and is outside the checkout.

The final running-Worker checks passed. Every response below carried `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: private, no-store, max-age=0`.

| Request | Result |
|---|---|
| Anonymous GET `/` | 401 with Basic challenge |
| Anonymous GET `/api/preview` without a secret | 401 without a Basic challenge |
| Enable request with an external redirect | 400 |
| Anonymous GET `/robots.txt` | 200 and `Disallow: /` |
| Authenticated GET `/` | 200 with HTML robots meta `noindex` |
| Anonymous GET of rendered browser script | 401 |
| Authenticated GET of that script | 200 |
| Authenticated GET `/t19-missing-route` | 404 |
| Authenticated GET `/BLOG` | 404 |
| Authenticated POST `/api/form` | 405 |
| Authenticated HEAD `/` | 200 with an empty body |

The read token was absent from the rendered HTML and the served script. An incomplete selected page returned a safe 422. Other incomplete pages did not prevent the valid page from opening.

## Real draft freshness

A dedicated unpublished `drafts.t19-preview-verification` page was created in the `development` dataset at `/t19-preview-verification`. The same running Worker returned `T19 draft revision one.`, then returned `T19 draft revision two.` after a real Sanity draft patch. No build or process restart occurred between these requests. The fixture remains an unpublished development draft. No production document was written.

Studio at `http://localhost:3333` generated a real preview secret. The enable endpoint validated it and returned 307. Opening that URL top-level rendered the authenticated page. Presentation's iframe did not finish loading in the browser automation session. The browser tool reported a paused document response and did not expose its diagnostics. Click-to-edit and automatic iframe refresh remain unverified; a top-level successful page is not evidence for those checks.

## Production isolation

Preview has its own Astro root and build output. A preview build must not create `apps/web/.wrangler/deploy/config.json`, which would redirect ordinary Wrangler commands to preview. The generated redirect file is confined to `src/preview/.wrangler/deploy/`. Astro sessions are disabled because preview uses its own signed cookie and needs no KV namespace.

After building preview and then the static site, verify-web started the production Worker on port 8794 and its doctor reported healthy. Observed probes were:

| Host and path | Status | Location | X-Robots-Tag |
|---|---|---|---|
| `127.0.0.1 /` | 200 | absent | noindex, nofollow |
| `www.zawlodzki.pl /` | 200 | absent | absent |
| `127.0.0.1 /index.html?x=1` | 301 | `http://127.0.0.1:8794/?x=1` | noindex, nofollow |
| `127.0.0.1 /O-MNIE` | 404 | absent | noindex, nofollow |
| `127.0.0.1 /favicon.svg` | 200 | absent | noindex, nofollow |

The static home remained the empty-production placeholder with title `Grzegorz Zawłodzki`. This check proves routing isolation, not imported-content parity.

## Automated checks and review

`pnpm --filter web preview:test` passed 14 tests. These include actual WebCrypto signatures, expiration, tampering, origin and dataset binding, key rotation, redirect boundaries, access to assets and request-scoped loading. `pnpm check` passed with zero schema errors or warnings and zero Astro errors or warnings. `pnpm --filter web exec tsc --noEmit` passed. `pnpm build` built the static web app and Studio. Existing Worker and SEO tests passed 33 tests; one parity test was skipped because this worktree has no private inventory.

Independent source reviews found missing visible fields in the stega filter; those fields and string-array items were added. The session review found no actionable auth bypass, token leak or open redirect. The optional deslop skill was unavailable; the diff was checked manually and by the independent reviewer.

## Live acceptance still required

The Cloudflare dashboard showed that `zawlodzki-web` had no Git repository connected to Workers Builds. Its OAuth API token also returned 403 for the Builds endpoints. Sanity reported no deployed Studio for this project.

Owner approval is required before deployment. Configure the real Studio URL, a least-privilege Viewer token, preview authentication and the new preview domain. Then connect Workers Builds, create its secret deploy hook and configure the published-content Sanity webhook using README.md. Verify Presentation field navigation and automatic refresh on the deployed origins. Measure an approved publish appearing on staging within five minutes before checking T19's acceptance box.
