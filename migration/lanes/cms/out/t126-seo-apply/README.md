# T126 SEO apply

## Inputs

- Backup taken 2026-11-20 with `node migration/tools/backup-sanity.mjs`. It holds 163 documents and 1512 assets, with sha256 `4cc84d0c532a618fbaa6f1d1cb37535c5c14c3e6f63134e8d1e24be64eee3f04`. The archive is outside git in `~/sanity-backups/zawlodzki/`. The production dataset had no drafts of `page`, `post` or `siteSettings`.
- The published SEO projection uses the query from the [T51 README](../t51-validation/README.md). It was saved outside the repo.
- [Filtered review](seo-review.tsv) holds the 44 T51 rows whose `old_text` still equals the published value. The copy is unchanged from T51.

## Skipped T51 rows

These 10 fields were shortened by hand after T51 and no longer overflow. They are not part of the patch.

| id | slug | field |
| --- | --- | --- |
| page-634daaa2c8ceab0fea939fe6 | / | seo.title |
| page-65364c7d554535d3e4141668 | /automatyzacja-procesow-biznesowych-nocode | seo.title |
| page-64aae5153be5dab60a907e5c | /automatyzacje-dla-pipedrive | seo.description |
| page-6a65a09038ad0c6d6d0a1aa3 | /kurs-ai-w-sprzedazy | seo.description |
| page-6a6524cc429bff76b57cc347 | /program-ai-dla-zespolu-sprzedazy | seo.description |
| page-65369078d23fa9556206c3cb | /program-partnerski | seo.title |
| page-6a82cef512f2263890a42ee2 | /sales-atlas-system | seo.title |
| page-64a7d3814f84e9058b6f6dad | /szkolenie-i-wdrozenie-asana | seo.title |
| page-64a7d3814f84e9058b6f6dad | /szkolenie-i-wdrozenie-asana | seo.description |
| page-634daaa2c8ceab408393a043 | /wspolpraca | seo.description |

## Patch

`python3 -I migration/tools/import/seo-t51-dry-run.py <projection> seo-review.tsv seo-mutations.json` generated [the patch](seo-mutations.json). It holds 30 patches with 44 fields, and each patch is guarded by `ifRevisionID`.

## Local dry run

The patch was applied to the backup's `data.ndjson`, and all 30 revision guards matched. Both copies were then checked with `sanity documents validate --file <ndjson> --format json --level info`.

| Copy | `string.maximum-length` errors | `custom` warnings |
| --- | ---: | ---: |
| Backup | 44 | 377 |
| Patched | 0 | 377 |

The `custom` warnings come from image validation against an export that has no asset files. They are identical in both copies and do not appear when validating the live dataset.
