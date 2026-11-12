# T51 validation and SEO dry-run

## Studio validation

On 2026-11-12, `pnpm --filter studio exec sanity documents validate --yes --dataset production --format ndjson` reported the following against the base and updated schemas.

| Marker | Before | After |
| --- | ---: | ---: |
| Item text required | 93 | 0 |
| Item title too long | 1 | 0 |
| Section heading required or blank | 12 | 0 |
| Plan price required or below minimum | 18 | 0 |
| Plan features required | 2 | 0 |
| Diagram key custom validation or allowlist | 102 | 0 |
| Diagram media warning | 51 | 0 |
| SEO title too long, including the site default | 31 | 31 |
| SEO description too long | 23 | 23 |
| **Total errors** | **282** | **54** |
| **Total warnings** | **51** | **0** |
| Documents with markers | 46 | 39 |

The base already includes the T47 fix for `service.course`. Studio's diagram list matches all 52 keys in the web registry. `pnpm --filter studio typegen`, `pnpm --filter studio check`, and the Studio fixture checks passed. Typegen regenerated the tracked types and the ignored local schema extract. The fixtures still reject overlong SEO text and unknown diagrams.

## Worker verification

The local Wrangler Worker served five production-content routes with HTTP 200 and `X-Robots-Tag: noindex, nofollow`. The uppercase route returned 404. See [HTTP probes](worker-probes.tsv).

- On the automation page, the Newsletter plan rendered its label and price note with zero feature entries. A neighboring plan rendered its numeric price.
- On the free materials page, the headingless content section rendered its cards. On the AI implementation page, the headingless CTA rendered its link to `/kontakt`. Neither block emitted an empty H2.
- The Asana training page rendered a checklist item with a title and no body paragraph. Its browser DOM contained the `zw-asana-problem` diagram. The CRM audit response contained `zw-audit-gap-k1`.

## Review the proposed SEO copy

[Before and after](seo-review.tsv) lists 54 fields across 28 posts, 10 pages, and the Polish site settings. [Proposed mutation payload](seo-mutations.json) groups those fields into 39 patches, each guarded by `ifRevisionID`. The patch is unapplied. The limits are 60 UTF-16 code units for titles and 160 for descriptions, matching Studio validation.

The fresh published SEO projection was saved at `/private/tmp/t51-private/published-seo.json`. The local document backup is `/private/tmp/t51-private/production.tar.gz`, exported without downloading asset files. Keep the export and projection outside the repo. For a later apply, take a new backup and regenerate the patch from a fresh projection. The generator stops if the review and current overflow set differ.

Use this projection with the published perspective:

```groq
*[_type in ["page","post","siteSettings"]]|order(_type,slug.current,_id){
	_id,_rev,"slug":coalesce(slug.current,_id),
	"values":{"seo.title":seo.title,"seo.description":seo.description,"defaultSeo.title":defaultSeo.title}
}
```

Save the query result array to a local JSON file. Generate the payload from the repo root:

```sh
python3 -I migration/tools/import/seo-t51-dry-run.py \
	/private/tmp/t51-private/published-seo.json \
	migration/lanes/cms/out/t51-validation/seo-review.tsv \
	migration/lanes/cms/out/t51-validation/seo-mutations.json
```

## Second validation pass

Applying the patch to a local copy of all 163 exported documents matched all 39 revision guards. Validating both copies with `sanity documents validate --yes --dataset production --file <file> --format ndjson` reduced SEO max-length markers from 54 to 0 and added zero markers. The asset-free export's image validation markers and two preview-secret draft warnings were identical on both passes.

After explicit approval and a future production apply, rerun the dataset validation without `--file` and confirm zero SEO max-length markers. The local result only verifies the proposed copy.
