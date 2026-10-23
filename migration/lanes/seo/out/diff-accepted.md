# Accepted crawl differences for G3

The original placeholder preflight below accepted no differences. The complete deployed-site comparison is classified in the final section.

The 2026-10-22 staging crawl has 115 differences against the live inventory. It lacks 105 inventory paths. The remaining ten differences affect the placeholder home page, one each for canonical path, H1, sitemap membership, language, description, robots meta, OG image presence, OG title, title and word count.

These are outstanding differences, not an approved migration result. See [the G3 preflight](g3-preflight.md) for evidence and prerequisites. Raw old and new values stay in the temporary evidence directory because the inventory is private.

Staging's `X-Robots-Tag: noindex, nofollow` is required by the host policy. `diff-crawls.mjs` does not compare that header, so it does not account for any of these 115 rows. Evaluate meta robots again on the complete build before accepting a robots difference.

Earlier tasks describe candidate intentional changes, including the Sales Atlas company-size correction, typed JSON-LD and path-based blog pagination. Those changes still need verification on the complete staging build. Listing them here does not accept unseen output.

## Full-content local repair result

The repaired local comparison is separate from the initial placeholder baseline. It has 152 rows, including 22 word-count changes that still need review. The 80 title and 80 OG-title mismatches from the first full-content build were fixed. [The repair report](g3-repairs.md) lists the remaining categories and their evidence. None of these local results substitutes for the deployed-staging gate.

## Deployed full-content comparison, 2026-10-23

The deployed production-dataset build has 152 diff rows. [The per-row disposition](evidence/staging-diff-disposition.tsv) records 130 accepted rows and 22 open rows. Raw old/new inventory values stay private.

Accepted differences, verified on staging:

- 105 language tokens use `pl` instead of `pl-PL`, preserving Polish as the default language.
- 15 sitemap additions follow the existing URL contract: each path is indexable and marked for sitemap inclusion.
- Six `/blog/strona/2` through `/blog/strona/7` routes are T18 pagination and have noindex meta.
- Two missing H1s are restored on newsletter and free-material pages.
- One Sales Atlas description applies the user's earlier company-size correction from 250 to 500 people.
- `/search` is a contract 301 to `/blog`; its absence as a standalone crawled page is expected and the redirect is verified.

The 22 word-count differences remain open. A count alone cannot prove whether a template section, navigation/footer or article content was omitted. They are not approved content removals. G3 remains blocked on those content differences. The final six Lighthouse samples pass. See [the staging report](g3-staging.md).
