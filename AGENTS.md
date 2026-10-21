# AGENTS.md

Instructions for any coding agent working in this repository (Claude Code, Codex, Cursor, Gemini or a human). Several agents may work here at the same time, each one independently. They coordinate only through the files and git history described below, never through chat.

## What this repo is

The migration of zawlodzki.pl from Webflow to Astro + Sanity, hosted on Cloudflare Workers, with DNS moving from OVH to Cloudflare. The repo is public: github.com/zawlodzki/nowa-strona-grzesiek.

`migration/PLAN.md` (Polish) explains the why: architecture, content model, gates, the cutover runbook and the user's decisions. The task board in `migration/tasks/` is the what.

## Working on a task

1. **Pick.** Run `git pull` and then `python3 -I migration/tools/tasks.py ready`. Take one task from that list. Tasks marked `(needs inventory)` need the private inventory clone (see "Inventory"). Skip them if you have no access.
2. **Claim.** Make a single change to the task file's front matter: `status: claimed`, `claimed_by: <tool>-<model>-<4 chars>` (for example `codex-gpt-k3n9`), `claimed_at: <ISO date>`, `branch: task/<id>-<slug>`. Commit only that file on `main` with the message `claim <id>` and push.
   - If the push is rejected, run `git pull --rebase`. If someone else has claimed the task in the meantime, drop your change and pick another task.
   - Claim commits are the only direct commits to `main`.
3. **Work.** Do all work on your branch and change only the paths listed in the task's `owns`. Read anything you like, but write nothing else. Before you start and before you open the PR, run `python3 -I migration/tools/tasks.py check`.
4. **Hand off.** Fill in the task's `## Handoff` section with what changed and where, deviations from the steps, follow-ups, and evidence for each `Done when` item. Tick the boxes that pass. Set `status: review` and `pr: <url>`. Open a PR to `main` titled `<id>: <title>`.
5. **Merge.** The user merges. Merging sets `status: done`. Agents never merge, force-push, or rewrite `main`.
6. **Blocked.** If you are blocked, set `status: blocked` and write the reason under Handoff. Then pick another task.
7. **Stale claims.** A claim with no commit on its branch for 48 hours may be taken over. The new agent records the takeover in Handoff.

Size: one task should fit in one working session. If it doesn't, split it. Splitting is a board change: add new task files and update `depends_on` in the claim commit.

## Shared files and contracts

- `migration/contracts/` holds the cross-task agreements: `url-map.csv`, `blocks.json`, `entities.json`, `tokens.json` and `decisions.md`. Only a task that lists a contract file in `owns` may change it. Every change adds a row to `decisions.md`.
- Need a contract change outside your task? Write the request under your task's Handoff as `Contract request: ...` and keep working against the current contract.
- `migration/lanes/<area>/out/` holds task outputs that other tasks read. Each file there is owned by exactly one task.
- `migration/tools/` holds the verification levers. A task that adds a tool owns it.

## Inventory (private, not in git)

`migration/00-inventory/` is a read-only snapshot of the live site, Webflow, GTM, DNS and GSC, taken 2026-10-21. It is gitignored because this repo is public. It lives in the private repo `zawlodzki/nowa-strona-grzesiek-inventory` (about 24 MB), which needs read access granted by the owner. Clone it into place from the root of this repo:

```bash
git clone https://github.com/zawlodzki/nowa-strona-grzesiek-inventory.git migration/00-inventory
```

In a worktree, clone it into the worktree's own `migration/00-inventory/`. A symlink to an existing clone also works. Run `git -C migration/00-inventory pull` before starting a task that needs it. The snapshot does not change except through a task that says so. Never commit it to this repo, never copy its raw files into tracked paths, and never paste record values, keys, tokens or webhook URLs into tracked files. Each folder has a `SUMMARY.md`.

## Commands

```bash
python3 -I migration/tools/tasks.py ready | list | check
python3 -I migration/tools/check-contracts.py      # gate G1, needs the inventory
python3 -I migration/tools/build-url-map.py        # regenerates contracts/url-map.csv, needs the inventory
node migration/tools/crawl.mjs --origin <url> --out <dir> [--max 2000] [--no-html]
node migration/tools/diff-crawls.mjs <old-crawl-dir> <new-crawl-dir> [--out diff.csv]
node migration/tools/redirects.mjs --out redirects.csv [--host <host>] [--cases migration/tools/cases-gsc-legacy.txt]
python3 -I migration/tools/jsonld_audit.py <crawl-out-dir>
python3 -I migration/tools/page_weight.py <url> <out.json>
```

The cutover gate: crawl staging, diff it against `migration/00-inventory/live-site/`, and document every intended difference. `diff-crawls.mjs` compares by path, so staging and production hosts can be compared directly.

## Invariants that are easy to break

- **URLs.** Every `keep` row in `contracts/url-map.csv` keeps its exact path. The canonical host is `https://www.zawlodzki.pl` with no trailing slash. Uppercase paths stay 404. Every `redirect-301` row must work.
- **Languages.** PL is the default and has no prefix. EN lives under `/en/` and ships after PL passes gate G5. Emit hreflang only for real PL/EN pairs.
- **JSON-LD.** Emit one `@graph` per page from typed Sanity data. Keep the `@id` values in `contracts/entities.json`. Person is the primary entity. No `SearchAction`, no `HowTo`.
- **Webflow workarounds.** Do not port `json-ld-extra`, the FAQ stored as seven field pairs, the ISO-date text copies, the duplicate `og:type`, or the global "Custom Code" component. Replace each one with a typed model.
- **Consent.** Keep the self-hosted c15t loader `consent.zawlodzki.com/assets/cmp-v1.js` and the inline Consent Mode v2 defaults. The c15t backend returns 403 to origins that are not allow-listed. GTM tags fire on the `consent-update` event.
- **Forms.** Forms post to the existing n8n webhook, which is stored only as the Worker secret `N8N_FORM_WEBHOOK`. They keep all 32 hidden attribution fields and stay behind Turnstile.

## Rules

- **CSS.** Before writing or editing any CSS, follow the `good-css` skill (`.claude/skills/good-css/SKILL.md`). Design work uses the `impeccable` skill (`.claude/skills/impeccable/SKILL.md`). Design scope is refine, not redesign.
- **External systems are read-only.** This covers Webflow, GSC, GTM, OVH and the c15t backend. These steps need the user's explicit yes at the moment of the action: any DNS change, the nameserver switch, DNSSEC changes, attaching custom domains, writing to the production Sanity dataset for the first time, publishing, and deleting anything. Tasks with `human_gate: true` contain such steps.
- **DNSSEC.** It is on at OVH and must be disabled before the nameserver switch. See `migration/PLAN.md` section 8.
