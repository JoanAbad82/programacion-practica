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

test("project is explicitly waiting for Phase 2 content import", async () => {
  const manifest = JSON.parse(await readFile(new URL("../content/block-1/manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.content_import_status, "PENDING_PHASE_2");
});
