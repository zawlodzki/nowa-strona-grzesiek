# Design parity

The gate compares every keep URL on the live site, the local Worker, and staging. It writes a region diff and a side-by-side for each pair, and it records the computed-style checks in `migration/lanes/design/out/parity/report.json`. Exit 0 means that report is complete and `counts.defect` is 0.

## Sub-features

- `shot-pairs` means each keep path is captured on live, local, and staging at 1280 and at 375. The pairs are `live-local`, `live-staging`, and `local-staging`. Each pair has a side-by-side at `$VERIFY_WEB_HOME/evidence/<run-id>/design-parity/<16 hex>.png`. The report stores that path.
- `style-rules` means each computed-style rule is judged at its own width. Section padding is 48px at 390 and 64px at 1440.
- `chrome-policy` means header and footer rows are listed from the status in `migration/tasks/T27.md`. While that status is not `done`, those rows do not by themselves make the exit code 1.
- `publish` means the run writes `migration/lanes/design/out/parity/report.json` and `facts.jsonl`. Side-by-side PNGs stay in the evidence directory from `shot-pairs`.

## How to get to it (user POV)

- Open a keep URL on the live site, then open the same path on the new site.
- Compare the page body, the header, and the footer.

## Driving it with web.sh

Preconditions:

- `.claude/skills/verify-web/scripts/web.sh doctor --port 8790` prints `doctor: healthy`.

Run these commands from the repo root.

```bash
.claude/skills/verify-web/scripts/web.sh up --port 8790
.claude/skills/verify-web/scripts/web.sh doctor --port 8790
node migration/tools/design-parity/run.mjs
```

- **Doctor.** The doctor command must print `doctor: healthy` before the parity command.
- **Parity.** Stdout is one line that starts with `parity: complete`. The counts in that line come from `migration/lanes/design/out/parity/report.json`.

## Gotchas

- The parity command does not start the Worker. A connection failure exits 2. Stderr is `parity: incomplete reason=worker-down` plus the origin name.
- Set `CHROME_BIN` to the Chrome binary on Linux. The command does not look in `/Applications/Google Chrome.app`.
- Header and footer rows are listed and do not by themselves make the exit code 1 while T27 is not done. When `migration/tasks/T27.md` has status `done`, those rows are defects. `node migration/tools/design-parity/run.mjs --reproject` rereads that file and rewrites the report without launching Chrome.
- A 375 screenshot does not prove the 48px section padding, which is checked at 390.
- Leave staging on its last deploy. This command does not deploy.
- Side-by-side PNGs are written under `$VERIFY_WEB_HOME/evidence/<run-id>/design-parity/`. `VERIFY_WEB_HOME` defaults to `$TMPDIR/verify-web`. The run id is the file `runs/<port>/run-id` from `web.sh`, or `adhoc-<port>` when that file is absent. A rerun does not put those PNGs in the repo.
