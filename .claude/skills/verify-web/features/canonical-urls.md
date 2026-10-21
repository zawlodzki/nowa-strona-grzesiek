# Canonical URLs and redirects

Every page has one canonical URL: no trailing slash, no `.html`, lowercase, on `https://www.zawlodzki.pl`. A visitor or crawler on a non-canonical variant gets a **301**, which is never a 307 or 308, and lands on the canonical URL with the query string kept. Uppercase variants are not redirected and stay 404, matching the Webflow site. After T13, every `redirect-301` row in `url-map.csv` sends the old path to its target in one hop.

## Sub-features

- `html-ext` means `/index.html` gives 301 to `/`, and `/<page>.html` gives 301 to `/<page>`.
- `index-alias` means `/index` gives 301 to `/`.
- `trailing-slash` means `/<page>/` gives 301 to `/<page>`, and `/index/` takes two hops, to `/index` and then to `/`.
- `query-kept` means `/index.html?x=1` gives 301 to `/?x=1`.
- `uppercase-404` means `/O-MNIE` and `/Index.html` return 404, not a redirect.
- `same-origin` means the redirect `Location` keeps the request host. Production gives `www.zawlodzki.pl`.
- `legacy-301` means each `redirect-301` row sends `old_path` to its target. This needs T13.

## How to get to it (user POV)

- Type a URL with a trailing slash or `.html`, or follow an old link that has one.
- Follow a legacy Webflow URL from a backlink, bookmark or Google result.
- Type a path in the wrong case.

## Driving it with web.sh

Preconditions:

- `web.sh doctor --port 8790` prints `doctor: healthy`.
- For `legacy-301`, T13 is merged. Until then, record it as failed: precondition missing (T13).

- **.html.** Run `web.sh probe /index.html --port 8790`. You get `301` with location `http://127.0.0.1:8790/`.
- **/index.** Run `web.sh probe /index --port 8790`. You get `301` to `/`.
- **Trailing slash.** Run `web.sh probe /index/ --port 8790`. You get `301` to `/index`. Probe the location again to see the second hop. Once real pages exist, repeat with a keep path, for example `/blog/` should give `301` to `/blog` in one hop.
- **Query kept.** Run `web.sh probe '/index.html?x=1' --port 8790 --label index-query`. You get `301` to `/?x=1`.
- **Uppercase.** Run `web.sh probe /O-MNIE --port 8790` and `web.sh probe /Index.html --port 8790`. Both give `404` with location `-`.
- **Production host.** Run `web.sh probe /index.html --port 8790 --host www.zawlodzki.pl --label index-prod`. You get `301` to `http://www.zawlodzki.pl/`, so the host is kept and not rewritten to localhost.
- **Legacy rows** (T13+). Probe each `redirect-301` row's `old_path`. The location must equal its target, and probing the target must give `200`. Compare with the GSC legacy cases using `node migration/tools/redirects.mjs --host <staging host> --cases migration/tools/cases-gsc-legacy.txt --out <evidence>/redirects.csv` against staging.

## Gotchas

- The local `Location` scheme is `http://` because wrangler serves http. On staging and production it is `https://`. Assert the host and path locally, and the scheme only on staging.
- The 307 to 301 upgrade lives in `src/worker/canonical.ts`. A 307 or 308 in a probe means the Worker was bypassed, or a new code path returned the assets response directly.
- Redirects to another origin are deliberately left untouched by `permanentCanonicalRedirect`.
- Apex `zawlodzki.pl` to `www` and the `.com` domains are handled at Cloudflare zone level after cutover (T22), not in this Worker, so you can't prove them locally.
