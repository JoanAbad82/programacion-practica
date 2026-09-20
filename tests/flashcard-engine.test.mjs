import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  deterministicShuffle,
  hashSeed,
  loadFlashcards,
  scheduleRepeat,
  validateFlashcardEngine,
} from "../scripts/flashcard-validation-lib.mjs";

const root = process.cwd();

test("Phase 5 flashcard validator passes", async () => {
  const result = await validateFlashcardEngine();
  assert.deepEqual(result.failures, []);
});

test("all 80 canonical flashcards remain available", async () => {
  const cards = await loadFlashcards();
  assert.equal(cards.length, 80);
  assert.equal(new Set(cards.map((card) => card.id)).size, 80);
});

test("flashcard shuffle is reproducible", () => {
  const values = ["A", "B", "C", "D", "E"];
  const seed = hashSeed("phase5");
  assert.deepEqual(
    deterministicShuffle(values, seed),
    deterministicShuffle(values, seed),
  );
});

test("MISS repeats soon and is capped at three exposures", () => {
  const current = {
    cardId: "B1-FC0001",
    direction: "FRONT_TO_BACK",
    exposure: 1,
  };
  const queue = [
    { cardId: "B", direction: "FRONT_TO_BACK", exposure: 1 },
    { cardId: "C", direction: "FRONT_TO_BACK", exposure: 1 },
    { cardId: "D", direction: "FRONT_TO_BACK", exposure: 1 },
  ];
  const repeated = scheduleRepeat(queue, current, "MISS");
  assert.equal(repeated[2].cardId, "B1-FC0001");
  assert.equal(repeated[2].exposure, 2);

  const capped = scheduleRepeat(queue, { ...current, exposure: 3 }, "MISS");
  assert.equal(capped.some((item) => item.cardId === "B1-FC0001"), false);
});

test("DOUBT repeats later and only once", () => {
  const queue = Array.from({ length: 6 }, (_, index) => ({
    cardId: `C${index}`,
    direction: "FRONT_TO_BACK",
    exposure: 1,
  }));
  const repeated = scheduleRepeat(
    queue,
    {
      cardId: "B1-FC0002",
      direction: "FRONT_TO_BACK",
      exposure: 1,
    },
    "DOUBT",
  );
  assert.equal(repeated[5].cardId, "B1-FC0002");

  const capped = scheduleRepeat(
    queue,
    {
      cardId: "B1-FC0002",
      direction: "FRONT_TO_BACK",
      exposure: 2,
    },
    "DOUBT",
  );
  assert.equal(capped.some((item) => item.cardId === "B1-FC0002"), false);
});

test("KNOW does not repeat in the same session", () => {
  const queue = [
    { cardId: "B", direction: "FRONT_TO_BACK", exposure: 1 },
  ];
  const output = scheduleRepeat(
    queue,
    {
      cardId: "B1-FC0003",
      direction: "FRONT_TO_BACK",
      exposure: 1,
    },
    "KNOW",
  );
  assert.deepEqual(output, queue);
});

test("the three approved self-ratings are present", async () => {
  const source = await readFile(
    path.join(root, "types/flashcard-session.ts"),
    "utf8",
  );
  for (const rating of ["MISS", "DOUBT", "KNOW"]) {
    assert.match(source, new RegExp(`"${rating}"`));
  }
});

test("local flashcard history is versioned", async () => {
  const source = await readFile(
    path.join(root, "lib/storage/flashcard-history.ts"),
    "utf8",
  );
  assert.match(source, /FLASHCARD_HISTORY_V1/);
  assert.match(source, /lastRating/);
});
