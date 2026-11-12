# T69 verification and activation

2026-11-12. Local `pnpm check`, `pnpm test`, and `pnpm --filter studio build` passed. Logs are adjacent. `test-gate.py` executes the workflow's actual first SHA gate against a local Git remote for current and stale commits. Re-run with `python3 -I migration/lanes/cms/out/t69-studio-deploy/test-gate.py`.

`verify-web` ran `up`, `doctor`, `probe /`, `shot /`, and `down` on 8791 using `wrangler dev --local`. Run 20261112-151452-p8791 passed doctor, HTTP 200 and screenshot. The earlier run lost its server between shell calls; its failed probes are retained as negative evidence. The successful run used one shell for the entire lifecycle. These prove the local web runtime, not a hosted Studio deployment.

## Decisions and sources

- [Deploy CLI](https://www.sanity.io/docs/cli-reference/deploy), [hosting](https://www.sanity.io/docs/studio/deployment), [schema deployment](https://www.sanity.io/docs/apis-and-sdks/schema-deployment), and [CLI config](https://www.sanity.io/docs/apis-and-sdks/cli-config) read on 2026-11-12. Local pinned CLI help also confirms `--yes`, `--no-build`, `--schema-required`, and `schemas deploy`. Studio deploy includes schema upload. `--schema-required` makes its failure fatal; a second schema upload is unnecessary.
- Sanity read-only `get_project_studios` returned one Studio, title zawlodzki.pl, app ID `rlo059cofkfg52kmdzfljxr8`. The CLI pins that ID. Confirm its hosted URL is zawlodzki.sanity.studio in Manage before enabling writes.
- Auto-updates are off so the lockfile and reviewed commit determine the Studio version.
- Deploy after every successful main push is intentional. Root lockfile and shared dependencies can affect Studio outside apps/studio. This avoids a persisted last-deployed marker and its partial-failure ambiguity. Concurrency serializes writes without cancelling a running deploy. Two remote-main checks reject stale queued/building runs; main may still advance after the final check during an upload.
- Model the Domain shaped the workflow around an immutable target SHA and a single current-commit gate.
- Throughput checkpoint. Blocking steps were board validation, docs and app-ID lookup. One workstream owns the workflow and its tests. Hosted Studio and main are shared state, protected by concurrency and SHA checks. One implementation owner avoids splitting this small coupled change.
- poteto-mode was read. Its external model/delegation workflow and cursor-team-kit deslop are unavailable in this harness; implementation and diff review were local. No alternative model was silently substituted.

## Human gate, commands prepared only

No deploy, secret setting, variable setting, production writes, or GitHub settings changes were performed. Workflow events build only until the repository variable exists. `workflow_dispatch` defaults to `no_deploy=true` and never reads the token in that mode.

After merge, a build-only dispatch on main can be run by Grzesiek:

```bash
gh workflow run deploy-studio.yml --ref main -f no_deploy=true
gh run list --workflow deploy-studio.yml --limit 5
```

This dispatch has NOT been run. GitHub cannot dispatch this new workflow from main before merge. The first Done-when remains pending this real main run.

Grzesiek must approve replacing hosted Studio and schema, confirm the host/app ID, and coordinate T50-T54 before enabling deploy. Ask him for a project-scoped robot deploy token with the minimum Deploy role for project 8u2zjhvn, not a personal or document-write token. He adds it via an interactive prompt, never in tracked files:

```bash
gh secret set SANITY_AUTH_TOKEN --repo zawlodzki/nowa-strona-grzesiek
```

Only after his explicit yes, enable automatic deploy and optionally dispatch the first real run:

```bash
gh variable set STUDIO_DEPLOY_ENABLED --body true --repo zawlodzki/nowa-strona-grzesiek
gh workflow run deploy-studio.yml --ref main -f no_deploy=false
```

The actual workflow command, after its final SHA check, is:

```bash
SANITY_STUDIO_DATASET=production pnpm --filter studio exec sanity deploy --no-build --yes --schema-required
```

It requires the token in the environment and a prior `pnpm --filter studio build`. Save the real run URL, commit SHA, successful Studio/schema logs and hosted schema confirmation here after approval. Neither hosted schema parity nor a real GitHub dry-run is claimed by local evidence. Agents never merge this PR.
