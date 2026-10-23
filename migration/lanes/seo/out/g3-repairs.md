# Import and frontend readiness repairs

The reported code and data-preparation blockers are repaired. The local Worker now serves every keep path. Production Sanity and the deployed staging Worker have not been changed. G3 is not complete.

The user authorized repairs after the initial preflight. T20's owns list was expanded to the importer and frontend files needed for those repairs. T19 and T21 files were left to their owners.

## What changed for visitors

- All 108 keep paths return 200 through the local Worker. The linked/sitemap crawl reaches 111 pages, including blog pagination, all returning 200.
- Every crawled page has exactly one H1. `/o-mnie` uses its leading feature heading, `/newsletter` uses its newsletter heading, and pages with no H1-capable opening block get their page title.
- The 80 post SEO titles now come from the URL contract. All indexable titles match it exactly. The post title used as H1 remains unchanged.
- The three noindex pages without descriptions get descriptions derived from their visible content. Indexable descriptions and existing descriptions are preserved. The strict frontend parser remains intact.
- Contact details and 12 service documents are present in development. Person, organization and PL settings were generated from the existing entity contract, page payload and source menus. The expired promotional banner is excluded from the navigation import.
- Content routes use Sanity images for the person and organization in JSON-LD. Missing entity images stop a real content build. The empty-project scaffold remains buildable.
- Unmodified posts use their publication date as `dateModified`. Service catalog entries receive descriptions and providers from the imported service documents.

The final local crawl has zero Webflow CDN references in its HTML. No raw HTML, inventory records or generated content payloads are committed.

## Verification

The real surface was `wrangler dev` on port 8796, built with `SANITY_DATASET=development`. Only healthy runs count toward the evidence. The initial run exited when its invoking tool session ended; that run's failed crawl was discarded. Later runs were kept inside a live execution session.

The crawler now accepts `--canonical-origin https://www.zawlodzki.pl`. It follows nested sitemap and absolute internal links through the requested target origin. Before this fix, a canonical sitemap could send probes to production Webflow. A regression test starts a real local HTTP server and verifies that both sitemap and page links stay on the target.

Committed evidence:

- [All 108 keep-path responses](evidence/local-keep-probes.tsv).
- [Local crawl and JSON-LD summary](evidence/local-verification.json).
- [Six mobile Lighthouse reports summarized](evidence/local-lighthouse.json).
- [Native export integrity audit](evidence/production-import-summary.json).
- [Development import readback](evidence/development-import-readback.json).

The Node suite passes 50 tests, including the crawler and SEO route regressions. The Python suites pass seven tests for description handling and export integrity failures. `astro check` reports no diagnostics. The default build on the empty production dataset also passes, preserving the scaffold used before import.

The JSON-LD audit finds one graph per page, no missing required properties and no dangling references. Its remaining 80 issue entries are the existing informational FAQPage rich-result warning. It also reports 14 unequal repeated definitions. These are 12 Service catalog stubs versus full service definitions, the Person's about-page offers and the Blog stub versus its full index definition. They are recorded separately from malformed JSON or property errors; the canonical entity IDs remain unchanged.

Mobile browser emulation at 375 pixels confirms no horizontal overflow on the home, about and newsletter pages. The headless shell screenshot helper can crop a narrower requested width on macOS. Those cropped images were not treated as overflow evidence.

Lighthouse 13.5.0 measured real Worker content with its mobile simulation defaults. One run per sample gave performance scores of 99 for home, Pipedrive, AI, Sales Atlas and blog, and 100 for the sampled Salesforce post. These are local integration measurements, not staging measurements or a before/after speedup claim. The machine reported 10 logical CPUs and a load average near 5.6. The export download had finished before measurement. SEO scores include the required local noindex header and are not production SEO scores.

## The import package

The private native Sanity archive is `/tmp/t20-repair/production-import.tar.gz`. It contains 161 documents and all 1,510 assets. The committed summary records its SHA-256, document counts, asset byte total and reference counts. `bundle.py` verifies every binary against its content hash and size, checks local asset paths, rejects draft/EN content and checks that document references stay inside the package.

The archive was imported back into development with the native CLI. A later direct API read confirms all 161 documents are byte-identical after excluding `_rev`, `_createdAt` and `_updatedAt`. The common semantic SHA-256 is `4147ac02294dfae9b5ea4679e95b82e4bc4d6ff987c09519c8e57f3a34a48669`.

The first immediate read showed temporary weak references and some missing asset fields while Sanity's asynchronous patches were being indexed. Follow-up reads then lost their network connection. On 2026-10-23 the direct API read completed and matched the pre-import snapshot exactly. The immediate partial result was not accepted as a completed import.

Reproduce the preparation without writing production:

```sh
python3 -B -I migration/tools/import/pages.py build --out /tmp/pages.ndjson --report /tmp/pages-report.json
python3 -B -I migration/tools/import/posts.py build --out /tmp/posts.ndjson --report /tmp/posts-report.json
python3 -B -I migration/tools/import/shared.py --pages /tmp/pages.ndjson --out /tmp/shared.ndjson
```

After updating development with those generated documents, export from `apps/studio`:

```sh
pnpm exec sanity dataset export development /tmp/production-import.tar.gz --no-drafts --types page,post,logo,testimonial,person,organization,service,siteSettings,sanity.imageAsset,sanity.fileAsset
```

Audit from the repository root:

```sh
python3 -B -I migration/tools/import/bundle.py /tmp/production-import.tar.gz --report /tmp/production-import-summary.json
```

The future production operation is the native import of the reviewed archive with `--dataset production --replace`. It includes actual asset bytes and local asset references, so it does not leave production pointing at development asset documents. Neither `--allow-assets-in-different-dataset` nor skipped/failing asset flags are needed. Existing importer production guards remain intact.

## Remaining G3 work and approval

The new local comparison has 152 rows rather than the initial staging baseline's 115. These measure different content states and cannot be read as a regression. The initial baseline was a placeholder. The new comparison exercises the full imported site.

The local rows are 105 language-token changes from `pl-PL` to `pl`, 15 sitemap additions, six new pagination paths, two added H1s, the approved Sales Atlas description correction, the replaced `/search` route, and 22 word-count changes. The 80 title and 80 OG-title differences observed on the first full-content build are fixed. No blanket acceptance is recorded for the remaining content changes.

The 22 word-count changes still need content/layout review. The existing static-page report also contains mapping-loss findings that this repair does not silently clear. Missing global navigation/footer rendering and source-template content need their own parity work. The new settings document prepares the existing menu data; it does not claim those layout components were implemented here.

Before G3 can pass, obtain explicit approval for the first production Sanity write and the staging deployment, import the package, build against production, deploy to the staging Worker and repeat all checks there. Review and fix or accept every remaining content difference. T21 separately owns consent, Tag Assistant and form-delivery QA. Production `www` remains on Webflow throughout these staging operations; cutover is a separate gate.

## Decisions

Fix Root Causes kept the required-description contract and corrected invalid imported utility documents. Model the Domain used deterministic shared documents and an asset/reference manifest. Build the Lever produced the shared-document builder and bundle auditor. Prove It Works required Worker probes and actual import/readback. Separate Before Serializing Shared State kept all repairs in the isolated T20 worktree.
