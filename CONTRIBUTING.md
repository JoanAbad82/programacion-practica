# Contributing

## Canonical validation

Before proposing a change, run:

```bash
npm ci
npm run check
```

`npm run check` is the canonical repository gate: content validators, lint, typecheck, unit tests, production build, and static-export QA.

## Engineering rules

- Read `AGENTS.md` before changing Next.js code.
- Preserve static-export compatibility.
- Keep canonical content, schemas, validators, and coverage matrices synchronized.
- Do not weaken deterministic seeds/session reproducibility without an explicit design change.
- Do not add a mandatory runtime AI/LLM or backend dependency.
- Keep progress storage versioned and backward compatibility explicit.

## Content changes

Content changes must preserve schema validity, concept traceability, answer uniqueness, and the relevant coverage/QA invariants.

## Pull requests

Prefer small, reviewable changes. State which validation commands were run and whether generated manifests/inventories changed.
