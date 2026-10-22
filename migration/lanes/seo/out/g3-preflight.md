# G3 is blocked before production import

Verified on 2026-10-22 against `https://zawlodzki-web.zawlodzki.workers.dev` and public Sanity read APIs. Source revision is `a0997ed`. This report does not approve import, deployment or cutover.

## Result

G3 fails its preconditions. Production has no content or assets, staging serves the placeholder, and the current development content fails the frontend build. Importing it unchanged would reproduce the build failure.

| Check | Observed result | Verdict |
|---|---|---|
| Staging crawl | 1 URL, 0 sitemap entries | Fail |
| Live inventory comparison | 115 differences, including 105 paths absent from the crawl | Fail |
| Direct probes of all 108 keep paths | 106 return 404; `/` and `/404` return 200 | Fail |
| Staging JSON-LD | 0 of 1 crawled pages has JSON-LD | Fail |
| Production dataset | 0 pages, posts, person, organization, settings, services, images or files | Import not performed |
| Development build | Stops on a missing `seo.description` | Fail |
| Local importer replay | 80 posts, 28 pages, 36 logos, 2 testimonials; two builds are byte-identical | Pass for local generation only |
| Mobile Lighthouse on six content pages | Not run; the pages are absent on staging | Not verified |

An empty JSON-LD audit has no reported property issues because it has no blocks to inspect. That is not a validation pass. A crawler starting at an empty sitemap also cannot prove that keep paths exist. The direct path probes provide the missing coverage.

The first direct-probe attempt used Python urllib and received 403 for every request, including `/`. Curl returned 200 for `/` and 404 for `/blog`. The complete probe set was therefore repeated with curl. The table uses the curl results. The reason for the client-dependent 403 is unresolved.

The committed [aggregate summary](evidence/preflight-summary.json) and [108 curl probes](evidence/keep-probes.tsv) come from a successful replay of `preflight.sh`. They contain no old inventory field values or generated content records.

## Content readiness

The public `development` query returned 80 posts, 28 pages, 36 logos, 2 testimonials, 1,489 image assets and 21 file assets. It returned no person, organization, service or site settings documents. The default frontend dataset is `production`.

The regenerated payload contains 146 documents. Its 28 pages cover all static keep rows in the current URL contract. Together with 80 posts, that is 108 keep paths. The older plan's target of 31 pages does not match the current contract and is not used to claim missing pages here.

Both generated payloads have zero unresolved asset placeholders and zero `website-files.com` references. Post SHA-256 is `0f36d87f09db2e6b0fdd7815e3712324f7a23338d51d82d00af0048733e88e8a`. Page payload SHA-256 is `362aa98263dac9776d15b27bb1a6828602011f1c6546fbb4dd68657163912ce0`. These hashes prove repeatable generation, not production readiness or dataset idempotence.

The page report identifies three missing SEO descriptions on `/404`, `/podziekowanie-konsultacja` and `/podziekowanie-newsletter`. T18 already records the conflict between absent source descriptions and the frontend's required field. The unchanged build reproduces it. No temporary parser patch was used.

The regenerated page report also records 75 sections with text loss, 11 missing alts and mapping losses. These findings need review before content acceptance. Overlength SEO fields are preserved by the importers. They are not silently rewritten or accepted by this report.

The asset map targets `development`. T17 explicitly requires a production asset map after approved production asset import. Copying document references alone does not create production assets. No production write command is proposed as ready while these preconditions fail.

## Reproduce the preflight

Run from a checkout with its own read-only inventory clone or symlink, Node and Python available. This script reads staging and Sanity and generates importer files locally. It does not import, deploy, publish or delete anything.

```sh
bash migration/lanes/seo/out/preflight.sh
```

The script prints a fresh temporary evidence directory. It retains the crawl, raw diff, direct keep probes, aggregate Sanity counts and generated payloads there. Do not commit that directory. Exit zero means the preflight completed, not that G3 passed. The script's data shapes are a path/status table, difference counts by field, and counts by dataset.

The development build failure was reproduced through the required Worker launcher in the original checkout. Its build stopped before a Worker started.

```sh
VERIFY_WEB_HOME=/tmp/t20-preflight/verify .claude/skills/verify-web/scripts/web.sh doctor --port 8796
SANITY_DATASET=development VERIFY_WEB_HOME=/tmp/t20-preflight/verify .claude/skills/verify-web/scripts/web.sh up --port 8796
VERIFY_WEB_HOME=/tmp/t20-preflight/verify .claude/skills/verify-web/scripts/web.sh down --port 8796
```

The initial doctor reported no owned run. `up` exited 1 during build on the missing description. `down` reported no started process. No unhealthy local Worker was driven. The deployed staging Worker supplied the HTTP evidence above. There are no screenshots or local page-rendering claims from this failed launch.

## Work required to resume G3

1. Resolve the noindex-page description contract in the importer/schema/frontend owners. Rebuild development without the temporary patch described in T18.
2. Review the reported content loss and missing shared entity/settings/service documents. Establish which data is required for the intended production pages and JSON-LD.
3. Prepare the complete production asset and document transfer, including a production asset map and reference checks. Existing importer `import production` commands deliberately refuse this write.
4. Obtain the owner's explicit approval for the first production write. Import and read back the intended data. Repeating the import must preserve document and asset identity.
5. Build the full site and obtain approval before deploying it to staging. Verify the deployed content, robots headers, canonical redirects and every keep path.
6. Rerun crawl/diff and JSON-LD validation. Review every difference individually. Retain evidence rather than accepting missing content as an intentional change.
7. Run mobile Lighthouse on `/`, `/szkolenie-i-wdrozenie-pipedrive`, `/wdrozenie-ai-w-sprzedazy-b2b`, `/sales-atlas-system`, `/blog` and `/blog/salesforce-cena`. Every sample must score at least 90 on the actual content build.

T21 separately owns consent, Tag Assistant and form delivery QA. The wider G3 requirements in PLAN also need that evidence. None of this report changes the production website, DNS or c15t.

## Scope and review

T20 owns only `migration/lanes/seo/out/**`, plus its task handoff. It cannot repair importer, schema, route or Worker behavior in this branch. Those changes need their own ownership before implementation.

The work ran sequentially. The blocking step was readiness verification. HTTP and dataset reads were independent, while builds and shared checkout operations were serialized. The checkout was moved to a dedicated T20 worktree after the shared checkout changed branches. No agent delegation was used, following the repository's independent-agent coordination rule.

The optional `cursor-team-kit` deslop and browser-control skills were not found in the installed caches. This report does not claim those skill checks passed. Diff, shell syntax and task-board checks were run directly. No application comments or application source were changed.
