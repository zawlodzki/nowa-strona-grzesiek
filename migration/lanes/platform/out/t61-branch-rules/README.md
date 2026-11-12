# T61 proposal and operator runbook

Prepared on 2026-11-12 at main fb9ae9f19b84a33dd98c1dcd2a1ba07bd97ed031. No settings were changed. START authorizes preparation only.

## Proposed rules

`main-integrity.request.json` targets exactly `refs/heads/main`. It blocks deletion and non-fast-forward updates, with no bypass actors. Administrators are covered too. It does not prevent administrators from editing rules later.

`main-ci.request.json` requires GitHub Actions check `build`, integration ID 15368, with an up-to-date branch. `CI` is the workflow title, not the check context. `live-checks.json` records the observed context. Cloudflare's separate Workers check is not proposed as required.

The CI ruleset grants repository administrators an always bypass, role ID 5. This keeps current direct claim commits possible. The integrity ruleset stays separate so this bypass cannot permit force-push or deletion. No PR-required rule is proposed. Non-bypass users must have the required check before updating main. A claim push by a non-admin would fail until checked. Current authenticated permissions include admin; this does not prove every agent credential has admin.

Tradeoff: GitHub does not restrict this bypass to claim files or commit messages. An administrator can also merge a failing PR. This proposal therefore cannot guarantee that every failing PR is unmergeable. AGENTS continues to prohibit agent merges and non-claim direct pushes. For an absolute CI guarantee, remove the CI bypass and replace direct claims with PRs in a separately approved protocol change. Giving all writers bypass would weaken the rule further and is rejected.

## Live evidence

- `live-rulesets.json` is an empty ruleset list.
- `live-main-rules.json` is the active branch-rules response, also empty.
- `live-protection.txt` records HTTP 404, Branch not protected.
- `live-checks.json` records checks observed on main. Pending conclusions are not CI success evidence.

These GETs prove the current absence of protection. They do not prove proposed enforcement. The three write probes below were NOT run. No browser verification applies to GitHub policy JSON. This checkout has no `scripts/web.sh`; the required final down attempt is recorded separately.

## Sources checked on 2026-11-12

- [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets). Public repositories support branch rulesets on Free. No paid plan assumption is needed for this public user-owned repository.
- [Available rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets). Status checks can be tied to an integration. Rules aggregate across rulesets.
- [Creating rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository). Repository admins can be bypass actors. Always bypass permits direct pushes; PR-only bypass does not preserve claims.
- [Rules REST API](https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset). Request fields and repository-role actor IDs.

## Activate only after a separate explicit approval

The following commands are prepared for Grzesiek. They were NOT executed. Review both payloads and refresh the GET evidence first. Creating active rulesets is an external settings change. Do not rerun POST blindly if a request times out; GET rulesets and inspect names and IDs first.

```bash
repo=zawlodzki/nowa-strona-grzesiek
out=migration/lanes/platform/out/t61-branch-rules
gh api "repos/$repo/rulesets"
gh api "repos/$repo/rules/branches/main"
gh api --method POST "repos/$repo/rulesets" --input "$out/main-integrity.request.json" > "$out/main-integrity.result.json"
gh api --method POST "repos/$repo/rulesets" --input "$out/main-ci.request.json" > "$out/main-ci.result.json"
gh api "repos/$repo/rules/branches/main" > "$out/active-main-rules.json"
```

Read back each created ruleset by its returned ID with `gh api repos/zawlodzki/nowa-strona-grzesiek/rulesets/ID`. Compare conditions, rules, bypass actors and enforcement with the payloads. Retain both responses. After verification, replace AGENTS' proposal sentence with the activation date and evidence paths. Preserve its warning about admin CI bypass.

## Prove enforcement only after separate approval

These probes write to GitHub. An unexpected success can change main. They are operator-only and are not authorized by START. Do not use `--dry-run` as enforcement evidence. Git does not send a real ref update during a dry run.

1. Use a scratch clone and pin the current remote head. After verifying the integrity ruleset is active and has no bypass, attempt a non-fast-forward update to its parent. Record nonzero exit and GitHub's rules violation, then confirm remote SHA stayed unchanged. This operation is forbidden for agents even after rules activation. The owner must perform it.

```bash
git clone https://github.com/zawlodzki/nowa-strona-grzesiek.git /tmp/t61-owner-probe
git -C /tmp/t61-owner-probe fetch origin main
before=$(git -C /tmp/t61-owner-probe rev-parse origin/main)
parent=$(git -C /tmp/t61-owner-probe rev-parse origin/main^)
git -C /tmp/t61-owner-probe push --force-with-lease="refs/heads/main:$before" origin "$parent:refs/heads/main"
git -C /tmp/t61-owner-probe ls-remote origin refs/heads/main
```

2. Claim a real ready task with the administrator credential using the existing AGENTS protocol. Commit only that task file, with `claim <id>`, and perform a normal fast-forward push. Save push output and the resulting main SHA. Do not invent a fake claim or use an empty commit as claim evidence.

```bash
python3 -I migration/tools/tasks.py ready
# After editing only the selected task's claim front matter:
git add migration/tasks/SELECTED_ID.md
git commit -m 'claim SELECTED_ID'
git push origin HEAD:main
git ls-remote origin refs/heads/main
```

3. Prepare a disposable PR whose `build` job fails and record its head SHA and check conclusion. Test merging with a separate write credential that has NO admin bypass. The owner must approve this attempt too; a configuration error could merge the PR. An admin-token rejection is not expected and cannot establish this rule. Capture the server rejection and verify `merged` remains false. Never perform this attempt as an agent.

```bash
gh pr checks PROBE_PR --repo zawlodzki/nowa-strona-grzesiek
gh api --method PUT repos/zawlodzki/nowa-strona-grzesiek/pulls/PROBE_PR/merge -f sha=PROBE_HEAD_SHA -f merge_method=merge
gh pr view PROBE_PR --repo zawlodzki/nowa-strona-grzesiek --json mergedAt,headRefOid,statusCheckRollup
```

Use the separate non-bypass authentication context for all commands in probe 3. No credential values belong in evidence. Closing the probe PR, deleting its branch, or disabling rules requires separate approval. No cleanup or rollback was performed. To disable a created ruleset after explicit approval, prepare its full GET response as an update payload, set `enforcement` to `disabled`, retain only accepted request fields, then use `gh api --method PUT repos/zawlodzki/nowa-strona-grzesiek/rulesets/ID --input disabled.request.json`. Do not delete rulesets automatically.
