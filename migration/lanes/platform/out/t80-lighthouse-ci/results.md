# T80 blocked baseline

2026-11-12, branch task/T80-lighthouse-ci, baseline c6cc236.
Lighthouse CI 0.15.1 / Lighthouse 12.6.1, mobile defaults (simulated throttling),
headless Chromium, no consent interaction. Turnstile default test key
`1x00000000000000000000AA` from LeadForm. No production writes.

Used the repo verify-web skill: `web.sh up --port 8790`, then `doctor` (healthy),
`probe /` (200, noindex/nofollow), and `lhci collect` against the static build
served by Wrangler. First startup died between shell invocations; restarted in
the same shell as collection. Collection stopped after the homepage's three runs
and one blog run because the unchanged baseline is blocked. `web.sh down` ran.

| Homepage median (3 runs) | Measured | Required |
|---|---:|---:|
| Performance | 88 | >=90 |
| Accessibility | 100 | >=95 |
| Best practices | 96 | >=95 |
| SEO | 69 | >=95 |
| LCP | 1692 ms | <=2500 ms |
| CLS | 0 | <=0.1 |

The three homepage SEO scores are all 69. Lighthouse `is-crawlable` identifies
both the X-Robots-Tag header and page robots directive. The local Worker
intentionally applies staging noindex behavior. Changing these implementations
is outside T80 owns. No assertions were weakened or excluded to manufacture a pass.

First homepage run transferred 1007307 bytes total, 659703 bytes script and
888123 bytes third-party (the latter also includes remote content assets).
These are actual pre-consent measurements, not yet a suitable budget baseline.
T76 measured about 1001 KiB total on the homepage and documented GTM contention.
Setting a script budget above the existing ~644 KiB would accommodate a substantial
pre-consent payload already; setting it below that immediately fails the unchanged
site. Final budgets and margins are deferred until the baseline blockers are
resolved. No final thresholds/config or CI job retained; no CI artifact or
throwaway regression run exists. Raw extracted measurements are in measurements.json.
