import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  deterministicShuffle,
  hashSeed,
  loadQuestions,
  validateQuizEngine,
} from "../scripts/quiz-validation-lib.mjs";

const root = process.cwd();

test("Phase 4 quiz validator passes", async () => {
  const result = await validateQuizEngine();
  assert.deepEqual(result.failures, []);
});

test("all 200 canonical questions remain available", async () => {
  const questions = await loadQuestions();
  assert.equal(questions.length, 200);
  assert.equal(new Set(questions.map((question) => question.id)).size, 200);
});

test("seeded shuffle is reproducible and preserves all values", () => {
  const values = ["A", "B", "C", "D", "E"];
  const seed = hashSeed("phase4-seed");
  const a = deterministicShuffle(values, seed);
  const b = deterministicShuffle(values, seed);
  assert.deepEqual(a, b);
  assert.deepEqual([...a].sort(), [...values].sort());
});

test("quiz engine exposes all four approved modes", async () => {
  const source = await readFile(path.join(root, "types/quiz.ts"), "utf8");
  for (const mode of ["BLOCK", "UNIT", "ERRORS", "ADAPTIVE"]) {
    assert.match(source, new RegExp(`"${mode}"`));
  }
});

test("quiz sessions use exactly the approved 10/20/30 sizes", async () => {
  const source = await readFile(path.join(root, "types/quiz.ts"), "utf8");
  assert.match(source, /QUIZ_SESSION_SIZES = \[10, 20, 30\] as const/);
});

test("session route carries session id, seed and fixed question ids", async () => {
  const source = await readFile(
    path.join(root, "app/tests/sesion/page.tsx"),
    "utf8",
  );
  assert.match(source, /\bsid\b/);
  assert.match(source, /\bseed\b/);
  assert.match(source, /\bids\b/);
});

test("question UI requires an answer before revealing feedback", async () => {
  const source = await readFile(
    path.join(root, "components/quiz/quiz-question-step.tsx"),
    "utf8",
  );
  assert.match(source, /disabled=\{!selectedOptionId\}/);
  assert.match(source, /Explicación/);
  assert.match(source, /Respuesta correcta/);
});

test("quiz history supports error review", async () => {
  const source = await readFile(
    path.join(root, "lib/storage/quiz-history.ts"),
    "utf8",
  );
  assert.match(source, /QUIZ_HISTORY_V1/);
  assert.match(source, /lastCorrect/);
  assert.match(source, /incorrect/);
});
