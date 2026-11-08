# zawlodzki.pl verification map

This directory is the maintained source for verifying the user-facing behavior of the site in `apps/web`. Read this index before driving the site, then use the matching feature file as the recipe. Update it in the same PR that changes the behavior, for example when T12, T13, T14 or T18 lands.

## Baseline preconditions

- Run `pnpm install --frozen-lockfile` once in the checkout.
- `VERIFY_WEB_HOME` points at a scratch directory. In Claude sessions, use the session scratchpad.
- `web.sh up --port 8790` succeeded in this run, and `web.sh doctor --port 8790` prints `doctor: healthy`.
- Base URL `http://127.0.0.1:8790`. The local request host is `127.0.0.1`, which the Worker treats as non-production.
- Never drive an instance this run did not start.

## Driving conventions

- `web.sh` means `.claude/skills/verify-web/scripts/web.sh`, run with `--port 8790`.
- `probe` never follows redirects. Prove a chain one hop at a time.
- Add `--host www.zawlodzki.pl` to prove the production-host behavior, and leave it off for staging behavior.
- Find browser-pane elements by role and accessible name, such as heading `Nie znaleziono strony` or link `Wróć na stronę główną`.
- Paths are literal, case included. `/O-MNIE` and `/o-mnie` are different test cases.

## Proof and skip reporting

- Every claim cites a `probes.tsv` line, or a `shot` PNG plus its `.dom.html`, from `$VERIFY_WEB_HOME/evidence/<run-id>/`.
- A redirect proof shows status and `Location`. A page proof shows status, title or h1, and `x-robots-tag`.
- If a precondition does not exist yet (no Sanity content, no sitemap, no form route), report the recipe step as **failed: precondition missing**, name the task that adds it, and keep the step in the file. Never report it as passed through another path.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph describing the user-visible behavior. It then has exactly four H2s in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with web.sh`, `Gotchas`.

## Features

- [Consent loader and defaults (T26)](../../../../migration/tasks/T26.md) covers script order, the five Consent Mode signals, a single c15t loader, and banner choices. The Handoff records the local-origin CORS limitation. Use the [consent QA checklist](../../../../migration/lanes/tracking/out/consent-qa.md) for T21 tracking checks.
- [Navigation and footer (T27)](../../../../migration/tasks/T27.md) covers desktop and mobile navigation, keyboard open and close, current links, language-specific `siteSettings`, and exactly one consent-management control.
- [Design parity](./design-parity.md) compares every keep URL on live, local, and staging at 1280px and 375px, and checks computed styles against the refine rules.
- [Pages render](./pages.md) covers the home page and every `keep` URL from `contracts/url-map.csv` once routes exist.
- [Canonical URLs and redirects](./canonical-urls.md) covers 301 canonicalization of `.html`, `/index` and trailing slashes, uppercase paths that stay 404, and `redirect-301` rows.
- [Not found page](./not-found.md) covers unknown paths returning 404 with the branded page.
- [Robots by host](./robots-by-host.md) covers `noindex` on staging and local hosts, and indexable output on `www.zawlodzki.pl`.
- [Discovery files](./discovery-files.md) covers the sitemap index and per-language sitemaps, robots.txt, the blog RSS feed and llms.txt.
- [Lead forms](./forms.md) covers contact and newsletter forms: field names against `forms.json`, Turnstile, delivery to a local n8n stand-in and the error message.
- [Crawl diff gate](./crawl-diff.md) covers the site-wide crawl compared with the live-site inventory, which is the cutover gate.
