# T07 work plan

- [x] `how` over the affected subsystem.
- [x] `architect` for parallel design exploration.
- [x] Write the throughput checkpoint as four todo items.
- [x] Delegate code-writing to a subagent using your configured feature model.
- [x] Verify on the matching surface.
- [x] Rebase into small, ordered commits. Stack follow-ups. One implementation commit followed by the PR handoff.
- [x] If the design is contested, `interrogate` before shipping. Skip because neither schema candidate remains contested.
- [x] Run **Opening a PR**. https://github.com/zawlodzki/nowa-strona-grzesiek/pull/13

## Throughput checkpoint

- [x] Blocking first steps. Claim T07, confirm Sanity project, install compatible dependencies, obtain lockfile ownership.
- [x] Independent workstreams. One worker owns schemaTypes. The lead owns Studio configuration and verification.
- [x] Shared mutable state. Work in a separate checkout. Dependency and lockfile writes have one owner.
- [x] Smallest safe decomposition. One schema owner keeps references, shared Portable Text and blocks consistent. The lead independently reviews and runs Studio.

## Design choice

Explicit document, block, Portable Text and object modules use native Sanity definition helpers. Registry-driven generation was rejected because the contract describes field shapes in prose rather than an executable schema language.

The public website is unchanged by this task. Verify Studio directly and run Worker probes as a regression check. `verify-web` does not cover Studio.
