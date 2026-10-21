# Decisions

Written only by the coordinator. Newest at the bottom.

| # | Date | Decision | Decided by | Affects |
|---|---|---|---|---|
| 1 | 2026-10-21 | EN lives under `/en/` on www.zawlodzki.pl; zawlodzki.com keeps 301 | user | S, E, C |
| 2 | 2026-10-21 | Design scope is refine, not redesign | user | D |
| 3 | 2026-10-21 | Person is the primary JSON-LD entity; WebSite.publisher = Person; Wellbiz stays as worksFor | user | S, `entities.json` |
| 4 | 2026-10-21 | EN ships as a separate release after PL passes G5 | user | E |
| 5 | 2026-10-21 | EN scope: home, services, /o-mnie, /kontakt, /wspolpraca, /sales-atlas-system, top 10 posts by GSC clicks (`url-map.csv` en_planned) | user | E, S |
| 6 | 2026-10-21 | `/search` removed, 301 to `/blog`; SearchAction dropped | user | S |
| 7 | 2026-10-21 | All CSS is written with the `good-css` skill loaded | user | D, P, every lane |
| 8 | 2026-10-21 | Block set is 12 blocks (`blocks.json`). "Krok N", "Moduł N", "Tygodnie" are repeated `feature` blocks, not a dedicated steps block, because Webflow stores them as independent sections with their own media | coordinator | C, D, M |
| 9 | 2026-10-21 | Animated diagrams are code components selected by key, not editable content | coordinator | C, D, M |
| 10 | 2026-10-21 | `/401` removed; `/404` becomes the site 404 page; thank-you pages stay, noindex and out of the sitemap | coordinator | S, P |
| 11 | 2026-10-21 | GSC data and unpublished drafts (`/narzedzia`, `/case-study-4hfix`) stay out of the public repo | coordinator | all |
| 12 | 2026-10-21 | Work is split into a task board (`migration/tasks/`) that independent agents claim through git, per `AGENTS.md`. Lane sessions started by one coordinator are dropped | user | all |
| 13 | 2026-10-21 | `tokens.json` promoted from `lanes/design/out/` to `contracts/`. `apps/web/src/styles/build-tokens.mjs` compiles it to `tokens.css`, with hex written as oklch that round-trips to the same hex. Root font size stays 100%; no `scrollbar-gutter: stable`, because Chrome subtracts it from `vw` and breaks the Fixed-Ends Rule | T08 | D, every lane writing CSS |
| 14 | 2026-10-21 | User confirms zawlodzki.pl nameservers have moved to Cloudflare; production still points to Webflow. Creating new subdomains, including preview, and attaching them to their intended services is authorized. Existing records, apex/www cutover and DNSSEC changes still require explicit approval. | user | P, T, T19, T22 |
