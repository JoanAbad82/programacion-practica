<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository context for agents

## Purpose

Programación Práctica is a static-export learning platform for practical Python and PowerShell study. The repository contains canonical learning content, validators, schemas, deterministic quiz/session behavior, local progress storage, QA tooling, and release manifests.

`PROJECT_STATUS.json` provides a compact machine-readable snapshot of repository state, validation, architecture and interaction boundaries.

## Canonical sources

1. `README.md` — product architecture and supported workflows.
2. `schemas/` — machine-readable contracts for canonical content/progress.
3. `content/` manifests and coverage matrices — canonical content inventory.
4. `scripts/validate-*.mjs` and `npm run check` — validation rules.
5. `release/` manifests/inventories — release-candidate evidence.

## Definition of done

Run `npm run check`. A change is not complete if the canonical check fails.

## Boundaries

- Production must remain compatible with Next.js static export.
- No mandatory backend, SSR, account system, or runtime LLM dependency.
- Local progress keys are versioned contracts; changes require explicit migration/compatibility handling.
- Generated manifests and inventories are evidence surfaces; update them only through the repository's intended tooling.
- Do not infer current behavior from stale QA reports when source, schemas, validators, or current manifests disagree.
