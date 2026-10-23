# Sanity draft preview

This is a separate Astro SSR application. Production keeps its static build and its existing Worker. Preview shares the content parser, route table and renderer. Every authorized page request queries Sanity with the `drafts` perspective through the authenticated API, with no CDN and no process cache.

The preview boundary excludes incomplete unrelated pages and posts. Opening an incomplete document returns a 422 page explaining that required fields need attention. It never relaxes the production parser. An invalid reference or another data error can still produce this safe diagnostic. A failed Sanity request returns a separate 502 page without upstream error details.

## Build and run locally

Run these commands from the repository root with the workspace Node and pnpm versions.

```sh
pnpm install --frozen-lockfile
pnpm --filter web preview:test
pnpm --filter web preview:build
pnpm --filter web exec wrangler dev --config .wrangler/preview/server/wrangler.json --env-file /private/tmp/t19-preview.env --ip 127.0.0.1 --port 8791
```

Create the local environment file outside tracked paths with restrictive permissions. It needs these server-side values. Do not paste their values into the task, PR or logs.

- `SANITY_API_READ_TOKEN` is a least-privilege Sanity Viewer token able to read drafts in the chosen dataset.
- `SANITY_DATASET` is the dataset to preview, usually `development` during migration verification.
- `SANITY_STUDIO_URL` is the Studio origin, or its full workspace URL. Local `http://localhost:3333` is supported.
- `PREVIEW_AUTH_USER` and `PREVIEW_AUTH_PASSWORD` provide Basic Auth access. The password also signs short-lived editor sessions.

The build output is `apps/web/.wrangler/preview/`. It does not overwrite production `dist/`. The token is read from Cloudflare bindings at request time. It is never part of the Astro build environment or client JavaScript.

Presentation opens `/api/preview` with a Sanity preview secret. The GET endpoint validates that secret against the configured dataset using the server-only read token. It issues a one-hour HMAC-signed session bound to the preview origin and dataset, then redirects to a validated local path. The cookie uses `HttpOnly`, `Secure`, `SameSite=None`, `Partitioned` and `Path=/`. Both HTML and static assets require this valid session or Basic Auth. The preview always reads drafts. There is no browser-readable token or perspective cookie. Never put credentials in `SANITY_STUDIO_PREVIEW_URL`.

The handshake requires a browser that supports partitioned cookies in cross-site iframes. Use `localhost` for local browser testing so secure cookies are accepted. Direct access remains available through Basic Auth. Rotating `PREVIEW_AUTH_PASSWORD` invalidates existing editor sessions.

`SANITY_STUDIO_PREVIEW_URL` configures the Studio build. Its default is `https://preview.zawlodzki.pl`. Set it to the local preview URL when testing locally. The deployed Studio is `https://zawlodzki.sanity.studio`. Hosted Studio also runs inside `https://www.sanity.io`; the preview framing policy permits both ancestors.

## Verify the running Worker

Use the generated Wrangler configuration. `astro dev` is for development only and does not prove the preview entrypoint protects assets.

```sh
PREVIEW_ORIGIN=http://127.0.0.1:8791 node apps/web/src/preview/verify-running.mjs
```

The command reads the same local environment file when `PREVIEW_ENV_FILE=/private/tmp/t19-preview.env` is set. It does not print credentials. It checks anonymous and authenticated requests, headers, unknown paths, uppercase paths, robots, form rejection, and an actual stylesheet or script from the rendered home page. A valid home page is required.

In Studio, select a page or post in Presentation. Verify PL and EN locations, hover an encoded heading, click it to open its field, change a draft, and confirm the iframe reloads with the new text. The browser script uses Sanity's vanilla `enableVisualEditing` entrypoint and its refresh callback. Display text carries source-map encoding. IDs, URLs, slugs, dates and enum fields stay unencoded. The runtime check cannot prove the Studio handshake or editing UI without a deployed or locally authenticated Studio.

## Deploy preview

Deployment requires the owner's explicit approval under AGENTS.md. Do not run the deployment commands as part of a local verification pass.

1. Create the `zawlodzki-web-preview` Worker from the preview build. Use `pnpm --filter web preview:build` followed by `pnpm --filter web exec wrangler deploy --config .wrangler/preview/server/wrangler.json`.
2. Store `SANITY_API_READ_TOKEN`, `PREVIEW_AUTH_USER` and `PREVIEW_AUTH_PASSWORD` with `wrangler secret put --config wrangler.preview.jsonc NAME` in the web workspace. Set the non-secret dataset and actual Studio URL in the preview configuration.
3. Attach only the approved new preview subdomain. Keep apex and www on Webflow until the cutover gate.
4. Deploy Studio with its preview URL. Allow the Studio origin in Sanity CORS if needed for the Studio session. Server-to-server preview queries do not require browser CORS or a browser token.
5. Repeat the Worker probes and the interactive draft test on the deployed origin. Confirm `noindex` in HTML and `X-Robots-Tag`, `private, no-store` on successful and failed requests, and asset authentication.

The entrypoint rejects non-GET/HEAD requests. Preview cannot submit the production form or forward requests to the production n8n secret.

## Published-content rebuild hook

The destination is the static staging Worker `zawlodzki-web`. The preview Worker reads drafts on requests and does not need a rebuild when drafts change.

Workers Builds connects this repository to `zawlodzki-web` on `main`. Preview branch builds are disabled. The build environment sets `NODE_VERSION=24`. The deployment token has only Workers Scripts Edit for the selected account. For a replacement installation, connect the repository and deployment branch after owner approval. Configure the repository root as the build root, `pnpm --filter web build` as the build command, and `pnpm --filter web exec wrangler deploy` as the deployment command. Build from the selected published dataset. Treat the Workers Builds hook URL as a secret.

Create a Workers Builds deploy hook for that branch. Create a Sanity GROQ webhook in the same dataset, with POST as the method and the hook URL as its target. There is no deploy-hook handler in this repository. The webhook's HTTP request is the rebuild. Enable create, update, and delete. Leave draft events and content-release version events disabled. Sanity already ignores `drafts.` and `versions.` documents while those two settings are off.

On a delete, `after()` is null. A filter that reads only `_type` or `after()._type` does not match, so the hook never runs and the previous static deploy keeps serving the page. Read the type from `before()` first, and test the id that Sanity still exposes as `_id`.

```groq
!(_id in path("drafts.**"))
&& !(_id in path("versions.**"))
&& coalesce(before()._type, _type) in [
  "page", "post", "person", "organization", "siteSettings",
  "service", "logo", "testimonial", "translation.metadata", "sanity.imageAsset"
]
```

The Workers Builds hook ignores the body. The projection only has to evaluate, including when `after()` is null. Do not call `delta::operation()`.

```groq
{"_id": _id, "_type": coalesce(before()._type, _type)}
```

In the webhook preview, a published page create, update, and delete match. A draft edit and a `versions.` document do not. Keep the hook URL only in the Sanity webhook configuration, never in source, screenshots or handoff text. A direct Workers Builds hook uses its unguessable URL for authorization. If signature verification is required later, add a separately reviewed relay that verifies Sanity signatures before forwarding to the secret URL.

The staging Worker serves the last deployed asset set. It does not read Sanity on the request. A delete that does not produce a later successful build leaves the old HTML in place. Cloudflare also folds a second POST into the current build while that build is still queued or initializing, and Sanity treats the HTTP 200 as delivered. The attempts log for the webhook is the record of whether a delete was sent. The build history for `zawlodzki-web` is the record of whether a new deploy happened.

After setup, publish a harmless approved content change, record its Sanity timestamp and the Cloudflare build result, then fetch the staging page until the new text appears. Record the elapsed time and confirm it is below five minutes. Repeat with one referenced dependency. Editing only a draft must not create a production build. These are live acceptance checks. This code and local tests do not establish that the hook exists or that the five-minute target has passed.
