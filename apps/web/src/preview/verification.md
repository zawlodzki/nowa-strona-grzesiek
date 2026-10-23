# T19 verification

Verified locally on 2026-10-22 and rechecked on 2026-10-23. Preview and Studio were deployed with owner approval on 2026-10-23. No content was published.

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

`pnpm --filter web preview:test` passed 15 tests. These include actual WebCrypto signatures, expiration, tampering, origin and dataset binding, key rotation, redirect boundaries, access to assets and request-scoped loading. `pnpm check` passed with zero schema errors or warnings and zero Astro errors or warnings. `pnpm --filter web exec tsc --noEmit` passed. `pnpm build` built the static web app and Studio. Existing Worker and SEO tests passed 33 tests; one parity test was skipped because this worktree has no private inventory.

Independent source reviews found missing visible fields in the stega filter; those fields and string-array items were added. The session review found no actionable auth bypass, token leak or open redirect. The optional deslop skill was unavailable; the diff was checked manually and by the independent reviewer.

## Deployed verification on 2026-10-23

The deployed Studio is https://zawlodzki.sanity.studio. Preview is https://preview.zawlodzki.pl and uses the production dataset. Cloudflare stores the Viewer token and Basic Auth credentials as Worker secrets. Sanity CORS allows the Studio origin with credentials.

The custom-domain changeset contained one addition and no updates, removals, or conflicts. Attachment explicitly disabled replacement of existing origins and DNS records. Public DNS and HTTPS resolved correctly. The local resolver retained a negative response, so the full Worker probe used the public A record while preserving the hostname and TLS certificate verification. Every probe in the table above passed on both workers.dev and the custom domain. The read token was absent from HTML and browser JavaScript.

Hosted Studio opens inside www.sanity.io. The preview framing policy now includes that ancestor only for hosted sanity.studio origins. Presentation loaded the real home page, detected its page and logo documents, and enabled Edit. Clicking the rendered hero heading opened its corresponding heading field and focused it. No field value was changed.

Workers Builds connects only zawlodzki/nowa-strona-grzesiek to the static zawlodzki-web Worker on main. It builds from the repository root with `pnpm --filter web build`, deploys with `pnpm --filter web exec wrangler deploy`, and sets NODE_VERSION=24. Preview branch builds are disabled. The owner approved the GitHub App permissions for this repository. The first installation did not register with Cloudflare. An approved reinstall completed the connection.

The owner approved creating the default build token while builds were disabled, then restricting it before enabling builds. Its saved policy contains only Workers Scripts Edit for the selected account. No zone, storage, or user permissions remain.

The enabled Sanity webhook targets production with create, update, and delete events. Draft and version events are disabled. It uses the README filter and minimal projection. A direct POST to the secret deploy hook returned HTTP 200 and success true. Cloudflare build 5128aea8-bf64-4838-9fad-c580af8f27bc completed and deployed version bbd0c375. Deployment activity reported Ready 43s. This direct-hook check does not measure publication-to-page latency.

## Live acceptance still required

Automatic approval review rejected creating a test draft in the production dataset because deployment approval did not explicitly authorize that content write. A noindex test page is prepared locally, but has not been uploaded. Draft editing with automatic iframe refresh and an approved publish reaching staging within five minutes still require verification. The T19 acceptance box remains unchecked.

## Recheck after merging main, 2026-10-23

`origin/main` (`852825f`, T20) was merged. The shared renderer keeps preview props and T20's heading level. No production Sanity write and no Cloudflare account change.

CI run 39915696220 failed at 07:07:29Z on Portable Text block `0de630e270aa` in `/blog/asana-vs-jira`. The published post was updated at 07:09:02Z and now points that block at `image-7a12119b31531cfd5d78e4c6ce626803e1171c34-1920x2276-webp`. A fresh `pnpm build` rendered the page. verify-web run `20261023-082758-p8790` served it through `wrangler dev --local`. The body image request to `cdn.sanity.io` returned 200 and decoded at 1600 by 1897. Screenshots and `probes.tsv` are in `/tmp/t19-verify-web/evidence/20261023-082758-p8790/`.

Live `https://preview.zawlodzki.pl/` is 401 before a session. The framing policy names `https://zawlodzki.sanity.studio` and `https://www.sanity.io`. The hosted Studio URL redirects into `www.sanity.io` and asks for a login, so this pass did not open Presentation. A local Worker with dummy credentials accepts a session cookie that the client actually sends, then returns the safe 502 page because the token cannot read Sanity. The token is not in the HTML.

Workers Builds Git connection was not inspected. The dashboard client for this run is unauthenticated. The connection steps remain in `apps/web/src/preview/README.md`.

## Approved production test, blocked at 2026-10-23T08:47:16Z

The owner approved one throwaway production document on 2026-10-23. No token with write rights is present. The Sanity CLI is not logged in and Wrangler is not authenticated.

A dry-run mutation, `createIfNotExists` of `_id` `t19-test-permission-probe` with `_type` `page`, was sent to `https://8u2zjhvn.api.sanity.io/v2025-02-19/data/mutate/production?dryRun=true` with no Authorization header. The response was HTTP 403, `Insufficient permissions; permission "create" required`. A query at the same second returned count 0 for that id, `drafts.t19-test-permission-probe`, and titles matching `[T19 TEST]`. The dry run did not commit. No production document was created or deleted, and no deploy, DNS, or GSC action was taken.

Draft iframe refresh and the five-minute publish check remain open. They need a production token that can create, update, publish, unpublish, and delete, plus an interactive Sanity session for Presentation.
