# T62 evidence

Production dataset build on 2026-11-12: 117 HTML files, including excluded 404 and design-system pages. CSS: 37,646 bytes gzip, JS: 7,934 bytes gzip. Limits: 42,000 and 8,800 bytes. Each emitted `.css` and `.js` file is gzipped separately, then summed once across the entire dist tree. This conservatively includes unreferenced output and design-system assets; inline code and remote third-party resources are outside this build-artifact budget.

`production-build.log` records `SANITY_DATASET=production pnpm --filter web build` passing. The client defaults to the published production dataset; no credentials or writes were needed. `unit-tests.log` records failing fixtures for structural rules and budgets. `check.log` and `workspace-tests.log` record local checks. `preview-build.log` confirms the separate preview build still succeeds without running the production gate.

`broken-build.log` records the same build exiting 1 because `/` has two h1 elements. Reproduce from the repository root:

```sh
cp migration/lanes/platform/out/t62-dist-gate/break-build.mjs /tmp/t62-break.mjs
SANITY_DATASET=production NODE_OPTIONS='--import=/tmp/t62-break.mjs' pnpm --filter web build
cp -a /tmp/t62-good-dist/. apps/web/dist/
```

The proof import runs only at gate entry, saves the successful build to `/tmp/t62-good-dist`, creates `/tmp/t62-broken-dist`, inserts a second h1 in its homepage, and copies it to dist. It changes no tracked source. The regular gate has no bypass option. Good output was restored and checked again.

`worker-probes.tsv` records requests through `wrangler dev --local` on port 8790 via verify-web: production-host homepage and uppercase-path 404. The server was stopped with `scripts/web.sh down`.

Static keep policy follows `apps/web/src/lib/sanity/routes.ts`: `/`, `/blog`, `/404` are unconditional Astro routes. Every other keep route is Sanity-document dependent, including legal and service pages. Missing document routes are reported without failing. This is a structural deployment check; the crawl diff remains the cutover gate.

CI already runs every `migration/tools/**/*.test.mjs` and `pnpm build`, so no workflow modification was needed. Production `build` now runs Astro followed by the gate. `preview:build` remains separate.
