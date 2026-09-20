import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  referenceMasteryState,
  validateProgressAndMastery,
} from "../scripts/progress-validation-lib.mjs";

const root = process.cwd();

test("Phase 6 progress validator passes", async () => {
  const result = await validateProgressAndMastery();
  assert.deepEqual(result.failures, []);
});

test("mastery uses exactly a 12-evidence recent window", async () => {
  const source = await readFile(path.join(root, "lib/progress/mastery.ts"), "utf8");
  assert.match(source, /MASTERY_WINDOW_SIZE = 12/);
  assert.match(source, /slice\(0, MASTERY_WINDOW_SIZE\)/);
});

test("a concept with no evidence is NEW", () => {
  assert.equal(referenceMasteryState({ score: 0, interactions: 0, objectiveInteractions: 0, recentSignificantFailure: false }), "NEW");
});

test("UNDERSTOOD requires score, evidence and at least two quiz attempts", () => {
  assert.equal(referenceMasteryState({ score: 75, interactions: 4, objectiveInteractions: 2, recentSignificantFailure: false }), "UNDERSTOOD");
  assert.equal(referenceMasteryState({ score: 75, interactions: 4, objectiveInteractions: 1, recentSignificantFailure: false }), "LEARNING");
});

test("MASTERED requires stronger evidence and no recent significant failure", () => {
  assert.equal(referenceMasteryState({ score: 90, interactions: 6, objectiveInteractions: 3, recentSignificantFailure: false }), "MASTERED");
  assert.equal(referenceMasteryState({ score: 90, interactions: 6, objectiveInteractions: 3, recentSignificantFailure: true }), "UNDERSTOOD");
});

test("study evidence is deliberately weaker than active recall", async () => {
  const source = await readFile(path.join(root, "lib/progress/mastery.ts"), "utf8");
  assert.match(source, /STUDY_STUDIED_WEIGHT = 0\.5/);
  assert.match(source, /FLASHCARD_WEIGHT = 1/);
  assert.match(source, /1: 1\.5/);
  assert.match(source, /3: 2\.5/);
});

test("progress metadata still contains all 56 concepts and 12 units", async () => {
  const [concepts, units] = await Promise.all([
    readFile(path.join(root, "content/block-1/concepts/concepts.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "content/block-1/canonical/units.json"), "utf8").then(JSON.parse),
  ]);
  assert.equal(concepts.length, 56);
  assert.equal(units.length, 12);
});

test("adaptive engines are wired to unified mastery scores", async () => {
  const [quiz, flash] = await Promise.all([
    readFile(path.join(root, "lib/quiz/engine.ts"), "utf8"),
    readFile(path.join(root, "lib/flashcards/engine.ts"), "utf8"),
  ]);
  assert.match(quiz, /masteryByConcept/);
  assert.match(quiz, /masteryGap/);
  assert.match(flash, /masteryByConcept/);
  assert.match(flash, /masteryGap/);
});
