# Phase 5 — Flashcards Engine

**Status:** `CLOSED_PASS`

## Implemented

- `/tarjetas` session configurator
- `/tarjetas/sesion` active-recall runner
- `/tarjetas/resultados` session summary
- direct consumption of all 80 canonical flashcards
- unit, language and flashcard-type filters
- Mixed and Adaptive V1 modes
- session sizes: 10 / 20 / 30
- deterministic seeded card selection
- reversible direction only when the canonical card allows it
- front → back reveal before self-rating
- `No la sabía / Dudé / La sabía`
- bounded within-session adaptive repetition
- versioned local history (`FLASHCARD_HISTORY_V1`)
- responsive flashcard UI

## Adaptive V1

- `MISS`: repeat after approximately two pending cards, maximum three exposures
- `DOUBT`: repeat after approximately five pending cards, maximum two exposures
- `KNOW`: no repeat in the same session
- future adaptive sessions prioritize recent misses, doubts, and unseen cards

## Integrity boundary

Phase 5 consumes `BLOCK1_FLASHCARD_BANK_V1.0` but does not mutate the canonical flashcard bank.

## Closure gates

- Bootstrap: PASS
- Content Core: PASS
- Study Experience: PASS
- Quiz Engine: PASS
- Flashcards Engine validator: PASS
- ESLint: PASS
- TypeScript: PASS
- Automated tests: PASS
- Production build: PASS
- Post-build validators: PASS
- Git worktree: CLEAN
