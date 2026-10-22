# Accepted crawl differences for G3

No difference is accepted by this preflight.

The 2026-10-22 staging crawl has 115 differences against the live inventory. It lacks 105 inventory paths. The remaining ten differences affect the placeholder home page, one each for canonical path, H1, sitemap membership, language, description, robots meta, OG image presence, OG title, title and word count.

These are outstanding differences, not an approved migration result. See [the G3 preflight](g3-preflight.md) for evidence and prerequisites. Raw old and new values stay in the temporary evidence directory because the inventory is private.

Staging's `X-Robots-Tag: noindex, nofollow` is required by the host policy. `diff-crawls.mjs` does not compare that header, so it does not account for any of these 115 rows. Evaluate meta robots again on the complete build before accepting a robots difference.

Earlier tasks describe candidate intentional changes, including the Sales Atlas company-size correction, typed JSON-LD and path-based blog pagination. Those changes still need verification on the complete staging build. Listing them here does not accept unseen output.
