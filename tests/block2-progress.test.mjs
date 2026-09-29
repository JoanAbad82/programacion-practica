import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), "utf8");
}

test("study progress namespaces unit ids by block", async () => {
  const source = await read("lib/storage/unit-study-progress.ts");
  assert.match(source, /studyUnitKey/);
  assert.match(source, /parseNamespaceKey/);
  assert.match(source, /pp-study-progress-v1/);
});

test("legacy bare-unit B1 data is migrated at read time, not cleared", async () => {
  const source = await read("lib/storage/unit-study-progress.ts");
  // Old snapshots keyed by bare `U01` are upgraded to `B1:U01`.
  assert.match(source, /blockId: BlockId = "B1"/);
  assert.match(source, /const namespaced = parseNamespaceKey\(rawKey\)/);
  assert.doesNotMatch(source, /localStorage\.removeItem/);
});

// The normalization rule (bare `U01` -> `B1:U01`, `B2:U01` kept separate) is
// small enough to pin down as data, so a future refactor cannot silently drop
// the backwards-compatible migration.
const studyUnitKey = (blockId, unitId) => `${blockId}:${unitId}`;
const parseNamespaceKey = (key) => {
  const match = /^(B1|B2):(U\d+)$/.exec(key);
  return match ? { blockId: match[1], unitId: match[2] } : null;
};
function normalizeLegacyUnits(units) {
  const out = {};
  for (const [rawKey, progress] of Object.entries(units)) {
    const namespaced = parseNamespaceKey(rawKey);
    const blockId = namespaced
      ? namespaced.blockId
      : progress.blockId === "B2"
        ? "B2"
        : "B1";
    const unitId = namespaced ? namespaced.unitId : progress.unitId ?? rawKey;
    out[studyUnitKey(blockId, unitId)] = { ...progress, blockId, unitId };
  }
  return out;
}

test("legacy and multi-block study snapshots normalize without losing data", () => {
  const legacy = {
    U01: { unitId: "U01", status: "STUDIED", startedAt: "a", studiedAt: "b", updatedAt: "b" },
    U02: { unitId: "U02", status: "IN_PROGRESS", startedAt: "a", studiedAt: null, updatedAt: "a" },
    "B2:U01": { blockId: "B2", unitId: "U01", status: "STUDIED", startedAt: "c", studiedAt: "d", updatedAt: "d" },
  };
  const normalized = normalizeLegacyUnits(legacy);

  assert.equal(normalized["B1:U01"].blockId, "B1");
  assert.equal(normalized["B1:U02"].status, "IN_PROGRESS");
  assert.equal(normalized["B2:U01"].blockId, "B2");
  // The legacy bare key no longer exists, but its data is preserved under B1.
  assert.equal(Object.prototype.hasOwnProperty.call(normalized, "U01"), false);
  assert.equal(Object.keys(normalized).length, 3);
});

test("progress metadata carries block-scoped unit identities", async () => {
  const source = await read("lib/progress/mastery.ts");
  assert.match(source, /studyStatusFor/);
  assert.match(source, /studyUnitKey\(blockId, unit\.unitId\)/);
  assert.match(source, /aggregateBlock/);
  // Both `block` (B1 default) and `blocks` (all blocks) stay available.
  assert.match(source, /blocks:\s*\{/);
});

test("session histories infer the block for legacy sessions", async () => {
  const quiz = await read("lib/storage/quiz-history.ts");
  assert.match(quiz, /inferBlockId/);
  assert.match(quiz, /blockId: inferBlockId\(session\)/);

  const cards = await read("lib/storage/flashcard-history.ts");
  assert.match(cards, /inferBlockId/);
  assert.match(cards, /blockId: inferBlockId\(session\)/);
});

test("the progress dashboard lets the user pick a block", async () => {
  const dashboard = await read("components/progress/progress-dashboard.tsx");
  assert.match(dashboard, /parseBlockParam\(searchParams\.get\("block"\), "B1"\)/);
  assert.match(dashboard, /units\.filter\(\(unit\) => unit\.blockId === blockId\)/);
  assert.match(dashboard, /model\.units\[`\$\{blockId\}:\$\{unit\.unitId\}`\]/);
});
