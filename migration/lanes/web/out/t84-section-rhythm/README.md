# T84: Section rhythm evidence

Capture of the same production Sanity data on the local Cloudflare Worker before and after the change. The browser used reduced motion so the screenshots show the settled layout. Each image covers the full page.

| Page | 390 px | 1440 px |
| --- | --- | --- |
| Home | [Before](before/home-390.jpg) · [After](after/home-390.jpg) | [Before](before/home-1440.jpg) · [After](after/home-1440.jpg) |
| Pipedrive | [Before](before/szkolenie-i-wdrozenie-pipedrive-390.jpg) · [After](after/szkolenie-i-wdrozenie-pipedrive-390.jpg) | [Before](before/szkolenie-i-wdrozenie-pipedrive-1440.jpg) · [After](after/szkolenie-i-wdrozenie-pipedrive-1440.jpg) |
| Sales Atlas | [Before](before/sales-atlas-system-390.jpg) · [After](after/sales-atlas-system-390.jpg) | [Before](before/sales-atlas-system-1440.jpg) · [After](after/sales-atlas-system-1440.jpg) |

[Heading outline](headings.tsv) records tag and text for every heading in the three pages' main content. Home and Pipedrive have no skipped levels. Sales Atlas keeps its existing H2 to H4 jump in the tabs. T85 owns that fix.

[The staging diff](diff-staging.csv) has zero rows. Both crawls reached 111 URLs. The anchor comparison found no changes to IDs or fragment links on any page. The JSON-LD exports from the two local crawls are byte identical.

To repeat the capture, start the local Worker with `verify-web/scripts/web.sh` under `.claude/skills/`, then run from the repository root:

```sh
node migration/lanes/web/out/t84-section-rhythm/capture.mjs http://127.0.0.1:8840 /tmp/t84-capture
```

Run `compare.py <staging-crawl> <local-crawl>` on the two full crawler outputs to check IDs and fragment links.
