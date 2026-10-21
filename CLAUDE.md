# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

The migration of zawlodzki.pl from Webflow to Astro + Sanity, hosted on Cloudflare Workers, with DNS moving from OVH to Cloudflare. No application code exists yet. The repo holds the plan, a read-only inventory of the current site, and the verification tools. The repo is public at github.com/zawlodzki/nowa-strona-grzesiek.

`migration/PLAN.md` (Polish) is the source of truth. Read sections 3 (architecture and content model), 4 (exchange rules and file ownership), 7 (gates) and 10 (confirmed decisions) before any work.

## Layout

- `migration/00-inventory/` is a read-only snapshot taken 2026-10-21. It is gitignored and exists only in the main checkout at `/Users/grzesiek/Github/nowa-strona-grzesiek/migration/00-inventory/`, so worktrees must read it by that absolute path. The repo is public, so never commit it or copy its raw files into tracked paths. Each folder has a `SUMMARY.md`.
  - `webflow/` holds the API dump: pages, the `Wpisy` CMS collection (80 posts), components and the per-page section map, tokens, assets and scripts.
  - `webflow-settings/` holds the 301 rules and the site head and footer code.
  - `live-site/` holds the crawl of production: `urls.csv` and `urls.json`, raw JSON-LD per URL, redirects, third-party scripts and SEO visibility.
  - `gsc/` has Search Console performance and indexing data. `gtm/` has container GTM-P5V3CJ5 v54. `dns/` has the full OVH zone.
- `migration/tools/` holds the rerunnable verification levers (Node ≥ 18 with no dependencies, plus Python stdlib).
- Planned and not created yet: `migration/contracts/` (written only by the coordinator), `migration/lanes/<lane>/` (each lane writes only its own `STATUS.md` and `out/`), `apps/web` (Astro) and `apps/studio` (Sanity).

## Commands

```bash
node migration/tools/crawl.mjs --origin https://www.zawlodzki.pl --out <dir> [--max 2000] [--no-html]
node migration/tools/diff-crawls.mjs <old-crawl-dir> <new-crawl-dir> [--out diff.csv]
node migration/tools/redirects.mjs --out redirects.csv [--host www.zawlodzki.pl] [--cases migration/tools/cases-gsc-legacy.txt]
python3 -I migration/tools/jsonld_audit.py <crawl-out-dir>
python3 -I migration/tools/page_weight.py <url> <out.json>
python3 -I migration/tools/build-url-map.py      # regenerates contracts/url-map.csv
python3 -I migration/tools/check-contracts.py    # gate G1: contracts cover the inventory
```

The cutover gate is: crawl staging, diff it against `migration/00-inventory/live-site/`, and document every intended difference. `diff-crawls.mjs` compares by path, so staging and production hosts can be compared directly.

## Invariants that are easy to break

- **URLs.** All 105 indexable URLs keep their exact paths. The canonical host is `https://www.zawlodzki.pl` with no trailing slash. Uppercase paths stay 404. The six Webflow 301s in `webflow-settings/redirects.csv` must be carried over.
- **Languages.** PL is the default and has no prefix. EN lives under `/en/` and ships as a separate release after PL stabilizes. Emit hreflang only for real PL/EN pairs.
- **JSON-LD.** Emit one `@graph` per page from typed Sanity data. Keep the existing `@id` values (`/#organization`, `/#website`, `/o-mnie#person`, `<url>#webpage`). Person is the primary entity. Drop `SearchAction` and `HowTo`.
- **Webflow workarounds.** Do not port `json-ld-extra`, the FAQ stored as seven field pairs, the ISO-date text copies, the duplicate `og:type`, or the global "Custom Code" component. Replace each one with a typed model.
- **Consent.** Keep the self-hosted c15t loader `consent.zawlodzki.com/assets/cmp-v1.js` and the inline Consent Mode v2 defaults. The c15t backend returns 403 to origins that are not allow-listed. GTM tags fire on the `consent-update` event.
- **Forms.** Forms must post to the same n8n webhook (`flows.zawlodzki.com`), keep all 32 hidden attribution fields, and stay behind Turnstile.

## Working rules

- Before writing or editing any CSS, load the `good-css` skill. For design audits and the design system, use the `impeccable` skill. Design scope is refine, not redesign.
- Webflow (MCP or dashboard), GSC, GTM and OVH are read-only. DNS changes, the nameserver switch, DNSSEC changes, publishing, and deleting anything need explicit user approval. DNSSEC is on at OVH and must be disabled before the nameserver switch. See the runbook in PLAN.md section 8.
- Run parallel lanes as separate sessions, each in its own worktree on a `lane/<name>` branch. In this setup, subagents were blocked from writing report `.md` files, so they return findings as text.
