# Crawl diff gate

The cutover gate: a crawler starting from `/` and `/sitemap.xml` sees the same URLs, statuses, canonicals, titles, h1s, hreflang and JSON-LD types on the new site as on the live Webflow site. Every difference is either fixed or documented as intended. This is the site-wide check behind gate G3 (T20) and the cutover (T22).

## Sub-features

- `crawl-local` means the repo crawler runs against the local Worker and writes `urls.csv`.
- `sitemap-seed` means `/sitemap.xml` exists and lists the indexable keep URLs. This needs T13.
- `diff-live` means `diff-crawls.mjs` against `migration/00-inventory/live-site/` shows only documented differences. This needs the inventory, T13 and T18.
- `jsonld` means `jsonld_audit.py` on the crawl shows one `@graph` per page with the `@id`s from `contracts/entities.json`. This needs T12.

## How to get to it (user POV)

- Googlebot or another crawler discovers the site from the sitemap and internal links.

## Driving it with web.sh

Preconditions:

- `web.sh doctor --port 8790` prints `doctor: healthy`.
- For `diff-live`, the private inventory is cloned into `migration/00-inventory/` (see AGENTS.md "Inventory"). Without it, record it as failed: precondition missing (inventory).

- **Crawl.** Run `node migration/tools/crawl.mjs --origin http://127.0.0.1:8790 --canonical-origin https://www.zawlodzki.pl --out "$VERIFY_WEB_HOME/evidence/<run-id>/crawl"`. It prints `done: N urls, sitemap had M`. On the repaired development dataset this is `111 urls, sitemap had 104`. All 108 keep paths must also be probed directly because noindex thank-you pages and `/404` need not be linked or listed in the sitemap.
- **Sitemap** (T13+). Run `web.sh probe /sitemap.xml --port 8790`. You get `200` with an XML content type, and the crawl's `sitemap had M` matches the count of `in_sitemap=yes` rows in `url-map.csv`.
- **Diff** (inventory, T13 and T18). Run `node migration/tools/diff-crawls.mjs migration/00-inventory/live-site "$VERIFY_WEB_HOME/evidence/<run-id>/crawl" --out "$VERIFY_WEB_HOME/evidence/<run-id>/diff.csv"`. Every row in `diff.csv` is either fixed or listed as intended in the task Handoff.
- **JSON-LD** (T12+). Run `python3 -I migration/tools/jsonld_audit.py "$VERIFY_WEB_HOME/evidence/<run-id>/crawl"`. It reports no invalid blocks, and the `@id`s match `contracts/entities.json`.

## Gotchas

- The crawler records absolute URLs on `127.0.0.1:8790`. `diff-crawls.mjs` compares by path, so the hosts don't need to match, but canonicals are compared as written. Pass `--canonical-origin https://www.zawlodzki.pl` so nested sitemap locations and absolute internal links are fetched from the target Worker. The recorded canonical remains the production URL. Without this option, a canonical sitemap can lead a crawl away from the target.
- A local crawl always shows `x_robots_tag = noindex, nofollow`, because it isn't the production host. That diff is expected locally and on staging.
- Never copy raw inventory files into tracked paths. Keep `diff.csv` in the evidence dir, and summarize it in Handoff.
