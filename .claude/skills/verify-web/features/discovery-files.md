# Discovery files

Crawlers and AI agents find the site's content through four generated files: the sitemap index at `/sitemap.xml` with one child sitemap per language, `/robots.txt` pointing at it, the blog feed at `/blog/rss.xml` (the same path as on Webflow) and `/llms.txt`. All four are built at `astro build` time from published Sanity content, so they change only on a rebuild. Pages marked `seo.noindex`, which covers the thank-you pages and the cookies list, never appear in the sitemap.

## Sub-features

- `sitemap-index` means `/sitemap.xml` is a `<sitemapindex>` listing `https://www.zawlodzki.pl/sitemap-pl.xml`, and `sitemap-en.xml` only once EN content exists.
- `sitemap-lang` means `/sitemap-pl.xml` is a `<urlset>` with one `<loc>` per indexable PL page and post, each with `<lastmod>` from content, plus `/blog` when posts exist. Locs use the canonical host with no trailing slash.
- `sitemap-excluded` means no `noindex` document appears, in particular `/podziekowanie-konsultacja`, `/podziekowanie-newsletter` and `/lista-cookies-i-identyfikatorow`.
- `robots-txt` means `/robots.txt` allows everything and names `https://www.zawlodzki.pl/sitemap.xml`.
- `rss` means `/blog/rss.xml` is RSS 2.0 with PL posts, newest first.
- `llms-txt` means `/llms.txt` lists services, pages and posts as Markdown links with descriptions.

## How to get to it (user POV)

- Google and Bing read `robots.txt`, then the sitemap submitted in GSC at cutover (T22).
- Feed readers and the newsletter tooling subscribe to `/blog/rss.xml`.
- AI crawlers read `/llms.txt`.

## Driving it with web.sh

Preconditions:

- `web.sh doctor --port 8790` prints `doctor: healthy`.
- The build fetched the Sanity `production` dataset. Until the importers (T15, T16) have run, it holds no pages or posts, so the urlset, the feed and the llms.txt sections are empty but valid. Record content claims as failed: precondition missing (T15/T16), and still prove routes, content types and shape.

- **Routes and types.** Run `web.sh probe <path> --port 8790 --host www.zawlodzki.pl` for `/sitemap.xml`, `/sitemap-pl.xml`, `/robots.txt`, `/blog/rss.xml` and `/llms.txt`. Each gives `200`, with content types `application/xml`, `text/plain` or `application/rss+xml`, and `x-robots-tag` `-` on the production host.
- **Well-formed XML.** Run `xmllint --noout "$VERIFY_WEB_HOME/evidence/<run-id>/<label>.body"` on the three XML bodies. It prints nothing on success.
- **Exclusions.** Run `grep -c 'podziekowanie\|lista-cookies' <sitemap-pl body>`. It prints `0`.
- **Locs resolve.** Once content exists, extract every `<loc>` and probe its path with `--host www.zawlodzki.pl`. Each must give `200`, never a redirect, because a sitemap must list only canonical URLs.
- **Renderer unit tests.** Run `node --test apps/web/src/pages/sitemap/`. They prove ordering, escaping and exclusion on fixture content, which is what to cite while the dataset is empty.

## Gotchas

- The files are static. A content change in Sanity does not show until the deploy hook rebuilds (T19). A stale sitemap after publishing is expected before T19.
- A Sanity fetch error fails the build on purpose. An empty sitemap from a network blip would be worse than a failed deploy.
- `sitemap-en.xml` returns 404 until EN content exists. That is correct, not a missing route.
- On staging, the files carry `X-Robots-Tag: noindex, nofollow` like every other response, and robots.txt still names the production sitemap.
