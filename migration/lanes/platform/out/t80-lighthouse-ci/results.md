# T80 Lighthouse CI evidence

## Approved configuration (2026-11-13)

The owner revised the task after the initial blocked baseline. Performance >=85;
accessibility, best practices and SEO >=95; LCP <=2500 ms; CLS <=0.1.
Every assertion uses the independent median of three mobile runs per URL.
Lighthouse CI 0.15.1 pins Lighthouse 12.6.1 via the lockfile. Chrome for Testing
158.0.8127.18 is pinned in CI and was used locally (Linux ARM64).
The final configuration uses default mobile simulated throttling.

Only `is-crawlable` is skipped in collection and disabled in assertions; Lighthouse
recalculates SEO with all remaining audits. This preserves meaningful SEO scoring
rather than lowering its threshold to accommodate noindex. Local/staging noindex
is intentional. Existing `src/worker/robots.test.ts` coverage passes (6 tests),
including production headers. No Worker behavior changed.

Initial real-time (`devtools`) throttling exploration had homepage median
performance 80 on this machine; the final standardized mobile simulation is below.
The local measurements still fail several performance/LCP thresholds. These failures
are retained, not weakened or presented as passing. Hosted CI is separate evidence.

## Local final medians

Built static output served by `wrangler dev --local` on port 8790 via the repo's
verify-web skill. `up`, `doctor` (healthy), `probe /` (200, noindex/nofollow) and
`down` ran. All six URLs have three valid Lighthouse reports. The Turnstile test
key is explicit; no consent was given and no forms were submitted.

| Path | Perf | A11y | BP | SEO* | LCP ms | CLS |
|---|---:|---:|---:|---:|---:|---:|
| / | 83 | 100 | 96 | 100 | 2712 | 0.000 |
| /blog | 84 | 100 | 96 | 100 | 2871 | 0.000 |
| /blog/automatyzacja-sprzedazy | 83 | 100 | 96 | 100 | 1758 | 0.000 |
| /audyt-ai-sprzedaz | 85 | 97 | 96 | 100 | 2614 | 0.000 |
| /kontakt | 84 | 100 | 96 | 100 | 1260 | 0.000 |
| /newsletter | 81 | 100 | 96 | 100 | 2714 | 0.000 |

*SEO excludes only is-crawlable. Exact values and all individual runs are in
`local-medians.json`; all 54 executed assertions are in `local-assertions.json`.
The earlier pre-approval measurements remain in `measurements.json`.

## Resource budget rationale

Each limit is `ceil(median transfer bytes * 1.075 / 1024)` KiB: 7.5% plus at most
1 KiB rounding. This leaves a small allowance for changing third-party responses
while rejecting meaningful growth. Third-party weight includes remote images,
not just scripts; lighter pages therefore have their own limits. Existing GTM
before consent is explicitly accepted as baseline; reducing it is a future task.
T76 measured about 1001 KiB total on the homepage and described GTM contention;
this collection measures about 984 KiB. Budgets use current measurements rather
than the historical production Turnstile challenge.

| Path | Total median B / limit KiB | Script median B / limit KiB | Third-party median B / limit KiB |
|---|---:|---:|---:|
| / | 1007231 / 1058 | 659628 / 693 | 888047 / 933 |
| /blog | 894487 / 940 | 655444 / 689 | 798530 / 839 |
| /blog/automatyzacja-sprzedazy | 805344 / 846 | 654860 / 688 | 696211 / 731 |
| /audyt-ai-sprzedaz | 997251 / 1047 | 655442 / 689 | 887881 / 933 |
| /kontakt | 779497 / 819 | 655445 / 689 | 656001 / 689 |
| /newsletter | 828510 / 870 | 655439 / 689 | 706227 / 742 |

The LHCI assert matrix reads `apps/web/lighthouse-budget.json` and checks actual
resource-summary transfer bytes using median aggregation. This avoids the
performance-budget audit's per-run aggregation behavior. No third-party traffic
is mocked or blocked. The job starts the static build with verify-web, probes all
six paths, collects, emits a strict three-run summary, asserts and always exports
HTML/JSON reports plus raw LHRs, assertions and HTTP evidence as an artifact.

## Hosted CI and regression proof

Pending the draft PR runs. No CI success or negative-control result claimed yet.

### Workflow validation repair

The first implementation run (43391156128) failed before creating jobs because
`runner.temp` was referenced in job-level `env`, where GitHub's runner context is
unavailable. Moved VERIFY_WEB_HOME assignment into the audit shell step using
RUNNER_TEMP. The push/pull_request triggers and all approved thresholds are unchanged.

### Hosted simulation result and T76 throttling follow-up

Run https://github.com/zawlodzki/nowa-strona-grzesiek/actions/runs/43391614094
completed all 18 reports and uploaded artifact `lighthouse-reports` (14021940379).
The four failures are /blog LCP 2554.88 ms, /audyt-ai-sprzedaz LCP 2587.48 ms,
and /newsletter performance 82 and LCP 3245.54 ms. All resource budgets pass.
Raw /blog report records observed unthrottled LCP about 136 ms versus modeled
2554 ms; the image is eager, high priority, and discoverable in the initial HTML.
T76 explicitly documents simulated bandwidth contention and uses devtools mobile
throttling for its reliable LCP comparison. Follow-up uses devtools throttling
with unchanged default mobile network/CPU parameters and unchanged assertions.
This measures the throttled navigation directly rather than scoring an
unthrottled observation. Local and hosted follow-up results remain pending.
