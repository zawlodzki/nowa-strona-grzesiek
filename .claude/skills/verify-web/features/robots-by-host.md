# Robots by host

Search engines must not index anything except the production host. Every response on any other host (the workers.dev staging, previews, localhost) carries `X-Robots-Tag: noindex, nofollow`. Responses on `www.zawlodzki.pl` carry no such header. Separately, page-level `<meta name="robots">` comes from the page itself. It is `noindex` on every page while the site is under construction, and must be absent on indexable pages before cutover (T12/T22).

## Sub-features

- `staging-noindex` means a non-production host gets `X-Robots-Tag: noindex, nofollow` on HTML, redirects, 404s and assets.
- `prod-indexable` means the `www.zawlodzki.pl` host gets no `X-Robots-Tag` on any response.
- `meta-robots` means the page-level meta matches the `indexable` column of `url-map.csv`. Today every page is `noindex`, and this needs T12/T18.

## How to get to it (user POV)

- A crawler fetches any URL on staging, where it must see noindex.
- A crawler fetches a URL on production, where it must see indexable pages.

## Driving it with web.sh

Preconditions:

- `web.sh doctor --port 8791` prints `doctor: healthy`.

- **Staging HTML.** Run `web.sh probe / --port 8791`. The `x-robots-tag` column reads `noindex, nofollow`.
- **Staging redirect, 404 and asset.** Run `web.sh probe /index.html --port 8791`, `web.sh probe /nope --port 8791` and `web.sh probe /favicon.svg --port 8791`. All three read `noindex, nofollow`.
- **Production host.** Run `web.sh probe / --port 8791 --host www.zawlodzki.pl --label home-prod`. The `x-robots-tag` column is `-`. Confirm with `grep -i robots "$VERIFY_WEB_HOME/evidence/<run-id>/home-prod.headers"`, which prints nothing.
- **Production redirect and 404.** Run `web.sh probe /index.html --port 8791 --host www.zawlodzki.pl --label index-prod` and `web.sh probe /nope --port 8791 --host www.zawlodzki.pl --label nope-prod`. Both have `x-robots-tag` set to `-`.
- **Meta robots.** Run `grep -o '<meta name="robots"[^>]*>' "$VERIFY_WEB_HOME/evidence/<run-id>/home-prod.body"`. Today it prints `content="noindex"`, the expected scaffold state. After T12/T18, it must print nothing for `indexable=yes` rows.
- **Staging for real.** The deployed Worker can be checked read-only: `curl -sI https://zawlodzki-web.zawlodzki.workers.dev/ | grep -i x-robots-tag`.

## Gotchas

- The Worker branches on `url.hostname`, and wrangler dev passes the request `Host` header through, which is why `--host` works. A host like `zawlodzki.pl` (apex) or `www.zawlodzki.com` is *not* production for the Worker and gets noindex.
- Header absent on prod plus meta `noindex` in the body still means "not indexable". Check both before claiming a page is indexable.

## Host-aware robots.txt

Run `web.sh probe /robots.txt --port 8791 --label robots-local` and
`web.sh probe /robots.txt --port 8791 --host www.zawlodzki.pl --label robots-prod`.
Both must return 200 with `text/plain; charset=utf-8`.
The local body must be `User-agent: *` / `Disallow: /`, have no `Sitemap:` line,
and retain `X-Robots-Tag: noindex, nofollow`.
The production body must have `User-agent: *`, `Allow: /`, and
`Sitemap: https://www.zawlodzki.pl/sitemap.xml`, with no `Disallow:` rules
and no `X-Robots-Tag` header. Its comment welcomes AI crawlers and points to
`/llms.txt` and `.md` page versions. Do not block Markdown URLs.
The apex and all other hosts follow the local policy. The preview Worker's
existing robots response is separate and unchanged.
