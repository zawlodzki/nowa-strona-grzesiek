# G3 deployed staging, 2026-10-23

The approved production import and staging deployment are complete. G3 remains blocked: 22 content/layout differences are unresolved. The final six mobile Lighthouse samples pass the specified threshold. Public www continues to serve Webflow.

## Approved import and readback

The user explicitly approved the prepared 161-document, 1510-asset native Sanity package and deployment to staging. Immediately before import, production was empty and the archive matched its reviewed SHA-256:

`56ab5d498b61406f9f96f9c5f0f6d5c9337c6d2d835f0a41e267ab5bca6db846`

The native CLI completed its uploads, asset-reference updates and reference strengthening. Fresh API readback confirms 161 content documents, 1489 image assets and 21 file assets. All reviewed document content is identical after excluding `_rev`, `_createdAt` and `_updatedAt`. All asset URLs point into production. A production asset map was generated from the actual asset URLs; its 1838 source-URL mappings remain gitignored.

Evidence: [production readback](evidence/production-readback.json), [pre-approval archive audit](evidence/production-import-summary.json), [earlier development rehearsal](evidence/development-import-readback.json). The archive audit's `productionImported: false` is historical pre-approval state; the later readback records the completed operation. Raw archive, records, maps, HTML and crawls stay private under `/tmp`.

## Deployed artifact

Staging: <https://zawlodzki-web.zawlodzki.workers.dev>.

- Worker: `zawlodzki-web`, with its existing workers.dev trigger and no custom routes.
- Final version: `9d098050-1822-4d84-945f-ac03d671f3a7`.
- Source commit: `ec8f801a74796243d2745e8fcf74c4be662c8562`.
- Build dataset: `production`; 117 static pages generated.
- Deployment command, from `apps/web`: `pnpm exec wrangler deploy --config wrangler.jsonc --name zawlodzki-web`.

No DNS changes or cutover were performed. A direct request to public www still returned Webflow's site marker. The PR remains for the user to merge.

## Deployed verification

[The final summary](evidence/staging-verification.json) records the source and Worker version for these checks:

- [All 108 keep paths](evidence/staging-keep-probes.tsv) return 200.
- The corrected crawler reaches 111 pages, all 200, each with one H1 and one JSON-LD graph. The sitemap includes 104 URLs. Indexable titles match the URL contract.
- All crawled pages and [12 HTTP probes](evidence/staging-http-probes.json) have `X-Robots-Tag: noindex, nofollow`. The thank-you page also has noindex meta. The uppercase and missing paths return 404; `/index.html` and `/search` return 301.
- All six GSC legacy cases end at 200, including five redirects and one keep case.
- HTML has zero Webflow CDN references. JSON-LD has no missing-required-property or dangling-reference errors. The 80 FAQPage entries are informational rich-result restrictions. Fourteen unequal repeated definitions are the documented catalog/entity stubs versus fuller definitions, not malformed graphs.

The full-content diff has 152 rows. [The disposition manifest](evidence/staging-diff-disposition.tsv) accepts 130 against contracts and previous decisions. The remaining 22 word-count rows require content/layout review. [The acceptance record](diff-accepted.md) explains every accepted category. Missing navigation/footer rendering and source-template content are not approved removals.

Reproduce against the deployed Worker:

```sh
SANITY_DATASET=production pnpm --filter web build
node migration/tools/crawl.mjs --origin https://zawlodzki-web.zawlodzki.workers.dev --canonical-origin https://www.zawlodzki.pl --out /tmp/g3-crawl
python3 -I migration/tools/jsonld_audit.py /tmp/g3-crawl
node migration/tools/diff-crawls.mjs migration/00-inventory/live-site /tmp/g3-crawl --out /tmp/g3-diff.csv
node migration/tools/redirects.mjs --host zawlodzki-web.zawlodzki.workers.dev --cases migration/tools/cases-gsc-legacy.txt --out /tmp/g3-redirects.csv
```

The diff command correctly exits 1 while differences remain. Its current missing-path row is the accepted `/search` redirect.

## Mobile performance and delivery experiment

[Lighthouse evidence](evidence/staging-lighthouse.json) preserves every measured score, including unsuccessful runs. Lighthouse 13.5.0 uses its mobile simulation defaults with the real deployed content. The mandatory staging noindex header affects SEO scores, so performance is evaluated separately.

The first full deployment scored 93, 87, 87, 98, 98 and 98 for home, Pipedrive, AI, Sales Atlas, blog and the sampled Salesforce post. H1 rendering was LCP, with no blocking JavaScript time or layout shift. A shared CSS response introduced a render-blocking request, so a bounded experiment inlined styles and moved font preloads before SEO/JSON-LD.

The inlining experiment did not establish a reliable pass: five Pipedrive runs ranged 89–100 with median 97; five AI runs ranged 88–99 with median 89; home measured 81. This was not an alternating controlled comparison and host load was elevated (load average 17.62 on a previously observed 10 logical CPUs). No general speedup is claimed. Inlining also increased the home document transfer from about 19 KB to 50 KB, so it was reverted. Earlier font preload discovery remains; CSS rules and appearance are unchanged.

Final deployment performance scores, one mobile run per sample: home 100, Pipedrive 98, AI 97, Sales Atlas 95, blog 97 and Salesforce post 98. All six final-version samples meet 90, so the Lighthouse Done when item is checked. This is a sample gate, not a claim of stable scores or a measured speedup. Earlier failed runs remain in the evidence JSON. A final browser check at 375 pixels shows no horizontal overflow, one H1 and no failed loaded images; four below-viewport images remain lazy-loaded.

## Remaining work

Review and repair the 22 content/layout differences and repeat G3, including the performance samples, on the resulting deployment. T21 owns consent, Tag Assistant and form-delivery QA. Neither PR merge nor completion of this import/deployment alone marks G3 passed.

Prove It Works required native import readback and deployed Worker checks. Explain the Number kept failed measurements and rejected a speedup claim. Separate Before Serializing Shared State kept the work in its isolated T20 checkout.
