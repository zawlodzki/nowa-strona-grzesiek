# T76 Lighthouse results

Lighthouse 12.8.2, mobile preset, headless Chrome on macOS, 2026-11-12.

## Starting point: staging vs live Webflow (simulated throttling, one run each)

| Page | Webflow perf | Staging perf | Staging LCP | Staging page weight |
|---|---|---|---|---|
| `/` | 95 | 98 | 2.17 s | 5,016 KiB |
| `/blog` | 63 | 98 | 2.35 s | 2,983 KiB |
| `/blog/automatyzacja-sprzedazy` | 77 | 99 | 2.02 s | 2,813 KiB |
| `/audyt-sprzedazy` | 97 | 99 | 2.03 s | 2,997 KiB |
| `/o-mnie` | 84 | 100 | 1.41 s | 2,764 KiB |
| `/newsletter` | 71 | 82 | 2.94 s (CLS 0.257) | 2,854 KiB |

On staging, Turnstile's challenge took 1.7–3.5 MB of each page and GTM/gtag took 511 KiB.

## main vs T76: same machine, both served by `wrangler dev` (devtools throttling, median of 2)

`main` is `origin/main` at `a7eb951`. T76 is this branch. Locally the Turnstile test site key downloads a smaller challenge than the live key, so the weight saving here is smaller than on staging.

| Page | Version | Perf | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|
| `/` | main | 94 | 2,282 ms | 2,282 ms | 0.000 | 107 ms |
| `/` | T76 | 100 | 878 ms | 878 ms | 0.000 | 58 ms |
| `/blog/automatyzacja-sprzedazy` | main | 95 | 2,209 ms | 2,209 ms | 0.000 | 108 ms |
| `/blog/automatyzacja-sprzedazy` | T76 | 100 | 850 ms | 850 ms | 0.000 | 0 ms |
| `/audyt-ai-sprzedaz` | main | 94 | 2,281 ms | 2,281 ms | 0.000 | 120 ms |
| `/audyt-ai-sprzedaz` | T76 | 100 | 879 ms | 879 ms | 0.000 | 0 ms |
| `/newsletter` | main | 90 | 1,945 ms | 3,146 ms | 0.005 | 120 ms |
| `/newsletter` | T76 | 99 | 829 ms | 2,068 ms | 0.000 | 0 ms |

Simulated throttling, median of 2 (same servers):

| Page | Version | Perf | A11y | Weight | Turnstile bytes | Requests | Render-blocking | Contrast audit |
|---|---|---|---|---|---|---|---|---|
| `/` | main | 98 | 97 | 1,538 KiB | 473 KiB | 67 | 5 | fail |
| `/` | T76 | 98 | 100 | 1,001 KiB | 0 | 56 | 0 | pass |
| `/kontakt` | main | 100 | 97 | 1,249 KiB | 461 KiB | 37 | 5 | fail |
| `/kontakt` | T76 | 99 | 100 | 761 KiB | 0 | 26 | 0 | pass |
| `/newsletter` | main | 96 | 96 | 1,094 KiB | 246 KiB | 38 | 5 | fail |
| `/newsletter` | T76 | 94 | 100 | 813 KiB | 0 | 29 | 0 | pass |

Simulated `/newsletter` LCP is 2.86 s on T76 against 2.45 s on main. The LCP image now starts at 0 ms load delay with high priority, and the real transfer finishes within about 300 ms. Lantern's simulation then splits bandwidth between that image and GTM, which starts at the same moment. Devtools throttling, which really throttles the network, measures 3.15 s → 2.07 s.

## CSS budget (`migration/tools/check-dist.mjs`, now measured per page)

| | Heaviest page CSS, gzip |
|---|---|
| main | 38,855 B (`/audyt-ai-sprzedaz`) |
| T76 | 24,966 B (`/`) |

## Other checks

- Form flow, locally with the test key and `fetch` stubbed so nothing was sent: there were no `challenges.cloudflare.com` requests before interaction. On submit the request carried a `cf-turnstile-response` token. A second submit after an error carried a fresh token and still had one response field.
- Diagrams on `/szkolenie-i-wdrozenie-pipedrive` (6 diagrams): computed styles and box sizes of every element are identical on main and T76.
- `pnpm --filter web build` PASS, `pnpm --filter web test` 115/115, `astro check` 0 errors, `node --test migration/tools/check-dist.test.mjs` 33/33.
