# Content Core

`content/` is the source-controlled educational content layer.

## Block 1 authorities

- `BLOCK1_CANONICAL_V1.0`
- `B1_CONCEPT_BANK_V1.0`
- `B1_TEST_MATRIX_V1.0`
- `BLOCK1_TEST_BANK_V1.0`
- `BLOCK1_FLASHCARD_BANK_V1.0`

## Layout

```text
content/block-1/
├─ canonical/      12 study units + unit index
├─ concepts/       56 canonical concepts
├─ questions/      200 questions split by unit
├─ flashcards/     80 flashcards split by unit
├─ coverage/       canonical test coverage matrix
├─ manifest.json
└─ integrity.json
```

Content is independent from UI components. IDs are stable and are the link between study material, concepts, tests, flashcards and future progress data.

Run:

```text
npm run validate:content
```

before accepting any content change.
