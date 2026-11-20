# T127 title suffix

The web build appends " | Grzegorz Zawłodzki" to every `<title>`, `og:title` and `twitter:title` (`apps/web/src/seo/title.ts`). Stored SEO titles hold only the bare text. The owner chose this on 2026-11-20 and kept the 60-character Studio limit on the bare title.

## Measurement before the change (2026-11-20, production, published)

| Stored `seo.title` form | Count |
| --- | ---: |
| ends with " \| Grzegorz Zawłodzki" | 71 |
| ends with " \| Zawłodzki" | 2 |
| name elsewhere (`/wspolpraca`, `/polityka-prywatnosci`) | 2 |
| no brand | 33 |

On live Webflow (`00-inventory/live-site/urls.csv`), 97 of the 106 crawled titles carry the full suffix. The suffix is 21 characters. A limit of 60 − 21 = 39 was rejected because 32 of the 108 bare titles are longer than 39 characters.

## Production write

- Backup: `node migration/tools/backup-sanity.mjs` wrote `~/sanity-backups/zawlodzki/8u2zjhvn-production-2026-11-20T20-50-53.549Z.tar.gz` (outside git). It holds 163 documents, 1512 assets and 0 drafts, with sha256 `733fd6f5ff2aeda1a3a28a36966461cc96c7494821cd82154cbf6d659f11c1da`.
- Generator: `python3 -I strip-suffix.py <projection.json> .` read the published projection (raw perspective, no drafts; kept outside the repo) and wrote [titles.tsv](titles.tsv) (old → new) and [seo-mutations.json](seo-mutations.json): 76 patches, each guarded by `ifRevisionID`. That is 75 `page`/`post` titles plus `siteSettings-pl.defaultSeo.title`.
- Local dry run on the backup's `data.ndjson`: all 76 guards matched. Run with the new schema, `sanity documents validate --file` showed 76 "remove the name" warnings before the patch and 0 after, with no errors either way. The 377 image warnings come from an export without asset files and are the same in both runs.
- The owner answered "Yes, write it" on 2026-11-20. `sanity exec --with-user-token` applied the payload as one transaction, `xaWUyWpNlfGT757XyIeZPm`, with 76 results.
- After the write: `sanity documents validate --dataset production --level info` reported 163 valid documents, 0 errors, 0 warnings and 0 info markers. No stored SEO title contains "Zawłodzki".

## Built titles

`pnpm --filter web build` against production passed `check-dist`. `python3 -I check-titles.py apps/web/dist titles-built.tsv <inventory>/live-site/urls.csv` reported 117 pages and 0 problems. Every `<title>` ends with the suffix exactly once, and `og:title` and `twitter:title` equal it. [titles-built.tsv](titles-built.tsv) lists every page next to its live Webflow title. 85 of the 105 pages that also exist on Webflow are identical. The other 20 differ only by copy edits made earlier in T51, T126 or by hand, or by the suffix now being added or normalized (`/wspolpraca` puts the name last, `/polityka-prywatnosci` uses "|", and the two "| Zawłodzki" pages use the full name).

## Unchanged

JSON-LD does not read `seo.title`: `graph.ts` and `lib/sanity/seo.ts` name pages from `page.title`, the hero heading and `post.title`. The JSON-LD snapshot tests pass. Canonicals, hreflang and paths are not touched.
