# T60 test coverage

CI runs apps/web/src/**/*.test.{ts,mjs}, migration/tools/**/*.test.mjs, and each migration/tools/import/*_test.py. Preview tests also have a dedicated step.

The existing inventory parity case in apps/web/src/seo/graph.test.mjs requires private migration/00-inventory and retains its existing conditional skip.

The following bundled agent skill tests are excluded from the website CI gate. They belong to independent skill packages and need their separate runtime, dependencies or formal-verification toolchain. T60 adds no dependencies.

- .claude/skills/poteto-mode/scripts/check-plan.test.ts — independent bundled skill package.
- .claude/skills/poteto-mode/scripts/watch-pr/cli.test.ts — independent bundled skill package.
- .claude/skills/poteto-mode/scripts/watch-pr/github.test.ts — independent bundled skill package.
- .claude/skills/poteto-mode/scripts/watch-pr/policy.test.ts — independent bundled skill package.
- .claude/skills/statechart/scripts/test/chart.test.ts — independent bundled skill package.
- .claude/skills/statechart/scripts/test/cli.test.ts — independent bundled skill package.
- .claude/skills/statechart/scripts/test/config-fuzz.test.ts — independent bundled skill package.
- .claude/skills/statechart/scripts/test/corpus.test.ts — independent bundled skill package.
- .claude/skills/statechart/scripts/test/differential.test.ts — independent bundled skill package.
- .claude/skills/statechart/scripts/test/messages.test.ts — independent bundled skill package.
- .claude/skills/statechart/scripts/test/pipeline.test.ts — independent bundled skill package.
- .claude/skills/statechart/scripts/test/plain-tlc.test.ts — independent bundled skill package.
- .claude/skills/statechart/scripts/test/render.test.ts — independent bundled skill package.
- .claude/skills/statechart/scripts/test/tlc-out.test.ts — independent bundled skill package.
