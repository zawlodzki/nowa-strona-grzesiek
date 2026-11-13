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

The baseline is blocked: both hosted methods failed approved assertions. No green
Lighthouse job or negative-control result is claimed. See detailed results below.

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

### Direct mobile comparison: also blocked

Run https://github.com/zawlodzki/nowa-strona-grzesiek/actions/runs/43392531850
(head 1a7ea93) completed all 18 runs and uploaded `lighthouse-reports` artifact
14022206303. Build and e2e passed; Lighthouse failed. `ci-devtools-medians.json`
and `ci-devtools-assertions.json` preserve the exact hosted data. The complete
local comparison is in `local-devtools-medians.json` and
`local-devtools-assertions.json`. Both used the unchanged default mobile profile:
CPU slowdown 4, request latency 562.5 ms, download 1474.56 Kbps, upload 675 Kbps.

| Path | Hosted devtools perf | LCP ms | CLS |
|---|---:|---:|---:|
| / | 78 | 910.375 | 0.007713072 |
| /blog | 78 | 2147.777 | 0.000000000 |
| /blog/automatyzacja-sprzedazy | 79 | 900.015 | 0.000220994 |
| /audyt-ai-sprzedaz | 78 | 950.413 | 0.004952572 |
| /kontakt | 80 | 862.076 | 0.047205436 |
| /newsletter | 76 | 2055.182 | 0.100212213 |

Every hosted direct-throttled performance median is below 85. Newsletter CLS is
0.10021221281595426 on all three runs, above the unchanged 0.1 ceiling. Its
layout-shifts audit identifies the post-list section moving when the Satoshi
web font loads (score 0.0998549463), plus the heading (0.0003572665). Its TBT is
about 911 ms in the inspected run. Script CPU diagnostics identify GTM, both
gtag payloads, the consent loader and the document's rendering work.

The direct-throttling experiment therefore does not solve the baseline. Restored
the standard simulated mobile configuration after recording both comparisons.
With that configuration, the four hosted failures remain /blog LCP 2554.88 ms,
/audyt-ai-sprzedaz LCP 2587.48 ms, /newsletter performance 82 and LCP 3245.54 ms.
All resource budgets, accessibility, best practices and SEO-minus-is-crawlable
assertions pass. The artifact contains HTTP probes, 18 raw LHRs, exported reports,
all 54 assertion results and medians for each hosted run.

### Required follow-up outside T80 owns

A green baseline requires application performance work: investigate the existing
pre-consent script CPU and layout/rendering in `apps/web/src/layouts/Base.astro`,
page rendering under `apps/web/src/lib/sanity/`, and font fallback/layout behavior
under `apps/web/src/styles/`. These paths are not owned by T80. Third-party
backend changes are also outside this task. The owner explicitly deferred GTM
remediation. T80 cannot fix those behaviors through its CI/config/package paths
without changing what is audited, throttling less, or weakening assertions.
No such workaround was applied, and no repeated reruns were used to seek a lucky pass.

The task is blocked and PR #102 remains draft. No throwaway script was pushed:
the user made that proof conditional on a green baseline. The measurements/budget
Done when item passes; the passing-job and negative-control items do not.
Both local attempts cleaned up via `web.sh down --port 8790`.
