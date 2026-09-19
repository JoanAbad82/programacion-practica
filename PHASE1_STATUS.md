# Phase 1 status — R3

## R3 corrections

- TypeScript pinned to `6.0.3` for compatibility with the current `typescript-eslint` stack used by `eslint-config-next`.
- ESLint pinned to `9.39.5` because the Next.js ESLint plugin stack used by this bootstrap does not yet support ESLint 10 across all peer dependencies.
- Independence validator ignores Phase-1 maintenance hotfix artifacts instead of interpreting their own guard expressions as project dependencies.
- Phase-1 maintenance files are excluded locally from Git status through `.git/info/exclude`; they are not project source files.
- `*.tsbuildinfo` is ignored and removed before closure.
- The final validation executes install, bootstrap validation, lint, typecheck, tests, production build, a post-build validator pass, and requires a clean Git worktree.

## Closure gate

Phase 1 can only close when the runner reports:

```text
PHASE1_LOCAL_VALIDATION=PASS
STATUS=CLEAN
PHASE1_STATUS=CLOSED_PASS
```
