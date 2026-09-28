import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadBlock } from "../scripts/content-validation-lib.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), "utf8");
}

test("the study landing exposes both Bloque 1 and Bloque 2", async () => {
  const source = await read("app/estudiar/page.tsx");
  assert.match(source, /getBlockManifest\("B1"\)/);
  assert.match(source, /getBlockManifest\("B2"\)/);
  assert.match(source, /href=\{`\/estudiar\/\$\{copy\.slug\}`\}/);
  assert.match(source, /Bloque 2 · Disponible/);
});

test("Block 2 unit metadata and route generation cover 12 units", async () => {
  const data = await loadBlock("B2", root);
  assert.equal(data.units.length, 12);
  assert.deepEqual(
    data.units.map((unit) => unit.unitId),
    Array.from({ length: 12 }, (_, index) => `U${String(index + 1).padStart(2, "0")}`),
  );
  assert.deepEqual(
    data.units.map((unit) => unit.order),
    Array.from({ length: 12 }, (_, index) => index + 1),
  );

  const route = await read("app/estudiar/b2/[unitId]/page.tsx");
  assert.match(route, /generateStaticParams/);
  assert.match(route, /getBlockUnits\("B2"\)/);
  assert.match(route, /dynamicParams = false/);
  assert.match(route, /getBlockUnitBySlug\("B2", unitId\)/);
});

test("Block 2 index route delegates to the shared block index", async () => {
  const index = await read("app/estudiar/b2/page.tsx");
  assert.match(index, /BlockStudyIndex/);
  assert.match(index, /getBlockManifest\("B2"\)/);
  assert.match(index, /getBlockUnits\("B2"\)/);
});

test("Block 1 routes remain unchanged and legacy wrappers still resolve", async () => {
  const route = await read("app/estudiar/b1/[unitId]/page.tsx");
  assert.match(route, /getBlock1UnitBySlug/);
  assert.match(route, /getAdjacentUnits/);
  assert.match(route, /getBlock1Units/);

  const loader = await read("lib/content/study-content.ts");
  for (const token of [
    "getBlock1Manifest",
    "getBlock1Units",
    "getBlock1UnitBySlug",
    "getAdjacentUnits",
  ]) {
    assert.match(loader, new RegExp(token));
  }
});

test("multi-block session helpers keep the block unambiguous", async () => {
  const sessionParams = await read("lib/content/session-params.ts");
  assert.match(sessionParams, /parseBlockParam/);
  assert.match(sessionParams, /blockQueryValue/);
  assert.match(sessionParams, /blockFromContentIds/);

  const quizSession = await read("app/tests/sesion/page.tsx");
  assert.match(quizSession, /questionsForBlock\(blockId\)/);
  assert.match(quizSession, /value\("block"\)/);
  assert.match(quizSession, /blockId,/);

  const cardSession = await read("app/tarjetas/sesion/page.tsx");
  assert.match(cardSession, /flashcardsForBlock\(blockId\)/);
  assert.match(cardSession, /value\("block"\)/);
});
