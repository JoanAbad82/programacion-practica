import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadBlock1, validateBlock1 } from "../scripts/content-validation-lib.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("Block 1 Content Core passes the full validator", async () => {
  const result = await validateBlock1(root);
  assert.equal(result.ok, true, result.failures.join("\n"));
});

test("Block 1 contains exactly 12 units, 56 concepts, 200 questions and 80 flashcards", async () => {
  const data = await loadBlock1(root);
  assert.equal(data.units.length, 12);
  assert.equal(data.concepts.length, 56);
  assert.equal(data.questions.length, 200);
  assert.equal(data.flashcards.length, 80);
});

test("question and flashcard IDs are continuous", async () => {
  const data = await loadBlock1(root);
  assert.deepEqual(
    data.questions.map((q) => q.id),
    Array.from({ length: 200 }, (_, i) => `B1-Q${String(i + 1).padStart(4, "0")}`),
  );
  assert.deepEqual(
    data.flashcards.map((fc) => fc.id),
    Array.from({ length: 80 }, (_, i) => `B1-FC${String(i + 1).padStart(4, "0")}`),
  );
});

test("all 56 concepts have test and flashcard coverage", async () => {
  const data = await loadBlock1(root);
  const questionCoverage = new Set(data.questions.map((q) => q.primaryConceptId));
  const flashcardCoverage = new Set();
  for (const fc of data.flashcards) {
    flashcardCoverage.add(fc.primaryConceptId);
    for (const secondary of fc.secondaryConceptIds) flashcardCoverage.add(secondary);
  }

  for (const concept of data.concepts) {
    assert.equal(questionCoverage.has(concept.conceptId), true, `No question coverage: ${concept.conceptId}`);
    assert.equal(flashcardCoverage.has(concept.conceptId), true, `No flashcard coverage: ${concept.conceptId}`);
  }
});
