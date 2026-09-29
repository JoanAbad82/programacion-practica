import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadBlock } from "../scripts/content-validation-lib.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

async function readJson(relative) {
  return JSON.parse(await readFile(new URL(`../${relative}`, import.meta.url), "utf8"));
}

test("Block 2 loaders return exactly 12/72/240/96", async () => {
  const data = await loadBlock("B2", root);
  assert.equal(data.units.length, 12);
  assert.equal(data.concepts.length, 72);
  assert.equal(data.questions.length, 240);
  assert.equal(data.flashcards.length, 96);
});

test("Block 1 loaders still return exactly 12/56/200/80", async () => {
  const data = await loadBlock("B1", root);
  assert.equal(data.units.length, 12);
  assert.equal(data.concepts.length, 56);
  assert.equal(data.questions.length, 200);
  assert.equal(data.flashcards.length, 80);
});

test("multi-block helper rejects invalid block ids", async () => {
  await assert.rejects(() => loadBlock("B3", root), /B3/);
  await assert.rejects(() => loadBlock("block-1", root), /block-1/);
});

test("the same unit id U01 resolves separately for B1 and B2", async () => {
  const [b1, b2] = await Promise.all([
    loadBlock("B1", root),
    loadBlock("B2", root),
  ]);

  const b1u01 = b1.units.find((unit) => unit.unitId === "U01");
  const b2u01 = b2.units.find((unit) => unit.unitId === "U01");

  assert.equal(b1u01.blockId, "B1");
  assert.equal(b2u01.blockId, "B2");
  assert.notEqual(b1u01.title, b2u01.title);

  // Unit ids collide, so block-unique ids are the real identity.
  const b1Question = b1.questions.find((question) => question.unitId === "U01");
  const b2Question = b2.questions.find((question) => question.unitId === "U01");
  assert.match(b1Question.id, /^B1-Q/);
  assert.match(b2Question.id, /^B2-Q/);
});

test("Block 2 question and flashcard ids are block-unique and continuous", async () => {
  const data = await loadBlock("B2", root);
  assert.deepEqual(
    data.questions.map((question) => question.id),
    Array.from({ length: 240 }, (_, index) => `B2-Q${String(index + 1).padStart(4, "0")}`),
  );
  assert.deepEqual(
    data.flashcards.map((card) => card.id),
    Array.from({ length: 96 }, (_, index) => `B2-FC${String(index + 1).padStart(4, "0")}`),
  );
});

test("Block 2 canonical status is registered in the manifest and STATUS", async () => {
  const manifest = await readJson("content/block-2/manifest.json");
  const status = await readJson("content/block-2/STATUS.json");
  assert.equal(manifest.block_id, "B2");
  assert.equal(manifest.units, 12);
  assert.equal(manifest.concepts, 72);
  assert.equal(manifest.questions, 240);
  assert.equal(manifest.flashcards, 96);
  assert.equal(status.publication_status, "NOT_PUBLISHED_TO_WEB");
});
