import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Block 1 manifest keeps canonical counts", async () => {
  const manifest = JSON.parse(await readFile(new URL("../content/block-1/manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.units, 12);
  assert.equal(manifest.concepts, 56);
  assert.equal(manifest.questions, 200);
  assert.equal(manifest.flashcards, 80);
  assert.equal(manifest.canonical_version, "BLOCK1_CANONICAL_V1.0");
});

test("Phase 2 content import is explicit in the manifest", async () => {
  const manifest = JSON.parse(await readFile(new URL("../content/block-1/manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.content_import_status, "IMPORTED_PHASE_2");
  assert.equal(manifest.concept_bank_version, "B1_CONCEPT_BANK_V1.0");
  assert.equal(manifest.coverage_matrix_version, "B1_TEST_MATRIX_V1.0");
  assert.equal(manifest.test_bank_version, "BLOCK1_TEST_BANK_V1.0");
  assert.equal(manifest.flashcard_bank_version, "BLOCK1_FLASHCARD_BANK_V1.0");
});
