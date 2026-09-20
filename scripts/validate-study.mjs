import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const canonicalRoot = path.join(root, "content", "block-1", "canonical");
const failures = [];

const requiredFiles = [
  "app/estudiar/page.tsx",
  "app/estudiar/b1/page.tsx",
  "app/estudiar/b1/[unitId]/page.tsx",
  "components/study/block-unit-list.tsx",
  "components/study/study-content.tsx",
  "components/study/unit-progress-controls.tsx",
  "lib/content/study-content.ts",
  "lib/storage/unit-study-progress.ts",
  "types/study.ts",
];

for (const relative of requiredFiles) {
  try {
    await readFile(path.join(root, relative), "utf8");
  } catch {
    failures.push(`MISSING ${relative}`);
  }
}

const units = JSON.parse(
  await readFile(path.join(canonicalRoot, "units.json"), "utf8"),
);

if (units.length !== 12) failures.push(`UNITS expected 12, got ${units.length}`);

for (let index = 0; index < 12; index += 1) {
  const unit = units[index];
  const expectedId = `U${String(index + 1).padStart(2, "0")}`;
  if (unit.unitId !== expectedId) failures.push(`UNIT_ID expected ${expectedId}, got ${unit.unitId}`);
  if (unit.order !== index + 1) failures.push(`UNIT_ORDER ${unit.unitId}`);
  if (unit.sourceVersion !== "BLOCK1_CANONICAL_V1.0") failures.push(`UNIT_SOURCE_VERSION ${unit.unitId}`);

  const markdown = await readFile(path.join(root, "content", "block-1", unit.canonicalFile), "utf8");
  if (!markdown.includes("## Objetivo")) failures.push(`MISSING_OBJECTIVE ${unit.unitId}`);
  if (!markdown.includes("## Conceptos esenciales")) failures.push(`MISSING_ESSENTIAL_CONCEPTS ${unit.unitId}`);
}

const routeSource = await readFile(
  path.join(root, "app", "estudiar", "b1", "[unitId]", "page.tsx"),
  "utf8",
);
if (!routeSource.includes("generateStaticParams")) failures.push("STATIC_PARAMS missing");
if (!routeSource.includes("dynamicParams = false")) failures.push("DYNAMIC_PARAMS_GUARD missing");
if (!routeSource.includes("getAdjacentUnits")) failures.push("UNIT_NAVIGATION missing");
if (!routeSource.includes("UnitProgressControls")) failures.push("UNIT_PROGRESS_CONTROLS missing");
if (!routeSource.includes("/tests?unit=")) failures.push("UNIT_PRACTICE_LINK missing");

const loaderSource = await readFile(path.join(root, "lib", "content", "study-content.ts"), "utf8");
if (!loaderSource.includes('"content", "block-1"')) failures.push("CANONICAL_ROOT missing");
if (!loaderSource.includes("readFile")) failures.push("DIRECT_CANONICAL_READ missing");
if (!loaderSource.includes("canonicalFile")) failures.push("UNIT_CANONICAL_FILE_LINK missing");

const progressSource = await readFile(path.join(root, "lib", "storage", "unit-study-progress.ts"), "utf8");
for (const state of ["NOT_STARTED", "IN_PROGRESS", "STUDIED"]) {
  if (!progressSource.includes(state)) failures.push(`PROGRESS_STATE missing ${state}`);
}
if (!progressSource.includes("pp-study-progress-v1")) failures.push("PROGRESS_STORAGE_KEY missing");
if (!progressSource.includes("useSyncExternalStore")) failures.push("PROGRESS_EXTERNAL_STORE missing");

const testsPageSource = await readFile(path.join(root, "app", "tests", "page.tsx"), "utf8");
if (!testsPageSource.includes("searchParams")) failures.push("PRACTICE_CONTEXT_RECEIVER missing");

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("STUDY_VALIDATION=PASS");
console.log("BLOCKS=1/1");
console.log("UNIT_ROUTES=12/12");
console.log("CANONICAL_SOURCE=PASS");
console.log("UNIT_NAVIGATION=PASS");
console.log("UNIT_PROGRESS=PASS");
console.log("PRACTICE_CONTEXT=PASS");
