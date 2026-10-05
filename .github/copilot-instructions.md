# Programación Práctica — Copilot repository instructions

Read `AGENTS.md`, `PROJECT_STATUS.json`, `README.md`, and the relevant schemas/validators before editing.

Architecture:
- Next.js static export only;
- no required backend, SSR, account system, or runtime LLM;
- local browser storage is the persistence layer.

Change rules:
- preserve static-export compatibility;
- preserve deterministic quiz/session behavior and stable seeds;
- treat progress/storage keys as versioned contracts;
- keep canonical content, schemas, validators, coverage matrices, and release manifests synchronized;
- do not hand-edit generated inventories/manifests when a repository tool exists to produce them;
- do not add a mandatory runtime AI/API dependency.

Validation:
- run `npm run check` for any change that can affect production behavior/content;
- run `npm audit --omit=dev --audit-level=high` when dependencies change;
- run E2E when UI/session behavior changes.

Content changes must preserve schema validity, concept traceability, answer uniqueness, and the relevant coverage invariants.
