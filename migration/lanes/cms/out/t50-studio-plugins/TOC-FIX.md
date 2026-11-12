# TOC 2.0.0 non-array boundary fix

## Root cause

The upstream SectionFieldsRenderer calls isPortableTextNew(field.value) before its isArray guard in the second branch. isPortableTextNew immediately calls value.some. Configured field names also match nested section fields: hero.body is text, while feature.body is Portable Text. This is valid schema/data, not dataset corruption.

Read-only production queries confirmed those shapes on /szkolenie-i-wdrozenie-pipedrive and /szkolenie-i-wdrozenie-asana. review-data-shapes.json contains only section type and body shape metadata, not copied document content.

The helper now accepts unknown and returns false before calling .some unless Array.isArray(value). The renderer then skips unsupported nested values; empty arrays keep the existing empty behavior. Portable Text and ordinary section arrays retain their upstream handling.

## Packaging within T50 owns

Upstream's latest published version at investigation was 2.0.0. The patched package is sanity-plugin-table-of-contents-2.0.0-t50.tgz, built from the installed upstream 2.0.0 package with its MIT LICENSE and dependencies intact. toc-array-guard.patch is the reviewable source/runtime diff. The stale index.js source-map reference and map were removed. No other plugin behavior changed.

Studio's dependency now references that local archive, replacing the registry ^2.0.0 specifier. This is an explicit packaging deviation: plugin version remains 2.0.0. It avoids a global pnpm patch setting outside T50 owns, postinstall mutations, or ephemeral node_modules edits. The config continues using the same plugin API and options. pnpm install --frozen-lockfile succeeds. Once an upstream fix is released, replace the archive reference with a verified fixed release.

toc-array-guard.test.mjs extracts and tests the actual predicate in the shipped archive. It covers undefined, null, strings, objects, array-like objects, numbers, booleans, empty arrays, section arrays, malformed blocks and valid Portable Text. Run pnpm --filter studio test. This script participates in pnpm test in CI.

## Validation

- Studio check/build and workspace pnpm check/test/build: PASS.
- TOC regression: 10 passed, zero failed (review-toc-test.log).
- Web tests: 112 passed, one skipped (review-test.log).
- Preview: 15 passed (review-preview-test.log).
- Migration tool node tests: 83 passed (review-tools-test.log).
- Web tsc --noEmit: PASS (review-web-tsc.log).
- Python assets/bundle/pages tests: 8 + 4 + 13 passed.
- Board: PASS (review-board-check.log).

## Live proof remains blocked

Studio started locally against the production dataset, but Chromium reached the Sanity login screen. review-login-blocker.png is evidence of that blocker, NOT proof of a working inspector. CLI has no authToken; there is no authenticated browser profile in the VM. T3 browser also fails due to the host AppArmor sandbox policy.

toc-inspector.png remains the original macOS failure screenshot; it was deliberately not replaced with fabricated or unrelated evidence. Both reported pages and a blog post still need authenticated live inspection after this fix. Save toc-inspector.png (Pipedrive), toc-inspector-asana.png and toc-inspector-post.png when verified. Confirm navigation via entries and absence of panel errors. No live success is claimed.

T50 is blocked until that verification can run. No deploy, dataset mutation, typegen or schema extraction was performed. All servers/browser processes started during this fix were stopped.

## Follow-up for the inline error

The original guard stopped the crash in the Portable Text predicate, but the
section renderer still showed its error row for nested text fields. Filter
nested values by array type before handing them to the renderer. The section
itself remains clickable. Configured Portable Text and ordinary arrays still
reach the existing renderers.

The new regression failed on the previous archive because the selector returned
the Hero's text body. All 11 tests pass with the updated archive. Frozen-lockfile
installation, Studio type checking, schema validation and Studio build passed.

Verified in authenticated local Studio on the Pipedrive and Asana service
pages and the blog post about Asana pricing. All three showed a populated TOC
without the inline error. The Hero entries opened their section dialogs, and a
heading in the post navigated to the corresponding Portable Text block.
