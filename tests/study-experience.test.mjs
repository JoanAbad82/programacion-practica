import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const unitsPath = new URL("../content/block-1/canonical/units.json", import.meta.url);

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), "utf8");
}

test("Phase 3 study validator passes", () => {
  const result = spawnSync(process.execPath, ["scripts/validate-study.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /STUDY_VALIDATION=PASS/);
});

test("Block 1 exposes exactly twelve canonical study units", async () => {
  const units = JSON.parse(await readFile(unitsPath, "utf8"));
  assert.equal(units.length, 12);
  assert.deepEqual(units.map((unit) => unit.unitId), [
    "U01", "U02", "U03", "U04", "U05", "U06",
    "U07", "U08", "U09", "U10", "U11", "U12",
  ]);
});

test("unit route is statically generated and reads canonical content", async () => {
  const source = await read("app/estudiar/b1/[unitId]/page.tsx");
  assert.match(source, /generateStaticParams/);
  assert.match(source, /getBlock1UnitBySlug/);
  assert.match(source, /dynamicParams = false/);
});

test("study progress has the three approved unit states", async () => {
  const source = await read("lib/storage/unit-study-progress.ts");
  for (const state of ["NOT_STARTED", "IN_PROGRESS", "STUDIED"]) {
    assert.match(source, new RegExp(state));
  }
});

test("each unit hands its practice context to the statically exported test setup", async () => {
  const unitPage = await read("app/estudiar/b1/[unitId]/page.tsx");
  const testsPage = await read("app/tests/page.tsx");
  const quizSetup = await read("components/quiz/quiz-setup.tsx");
  assert.match(unitPage, /\/tests\?unit=/);
  assert.match(testsPage, /QuizSetup/);
  assert.match(quizSetup, /useClientSearchParams/);
  assert.match(quizSetup, /searchParams\.get\("unit"\)/);
  assert.match(quizSetup, /searchParams\.get\("mode"\)/);
});
