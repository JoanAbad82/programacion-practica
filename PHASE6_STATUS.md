# Phase 6 — Progress & Mastery

**Status:** `CLOSED_PASS`

## Implemented

- unified mastery derived from study, quiz and flashcard evidence
- maximum 12 recent evidences per concept
- deterministic 0–100 mastery score
- states: NEW → LEARNING → UNDERSTOOD → MASTERED
- regression after recent significant failures
- summaries for 56 concepts, 12 units and Block 1
- `/progreso` dashboard with useful learning statistics
- mastery-aware adaptive quiz selection
- mastery-aware adaptive flashcard selection
- local-first derived progress; no duplicate mastery database

## Mastery gates

- UNDERSTOOD: score >= 70, at least 4 evidences and at least 2 quiz attempts
- MASTERED: score >= 85, at least 6 evidences, at least 3 quiz attempts and no recent significant failure

## Integrity boundary

Phase 6 derives progress from existing V1 study, quiz and flashcard histories and does not mutate the canonical Content Core.

## Closure gates

- Bootstrap: PASS
- Content Core: PASS
- Study Experience: PASS
- Quiz Engine: PASS
- Flashcards Engine: PASS
- Progress & Mastery validator: PASS
- ESLint: PASS
- TypeScript: PASS
- Automated tests: PASS
- Production build: PASS
- Post-build validators: PASS
- Git worktree: CLEAN
