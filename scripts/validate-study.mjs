import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "app/estudiar/page.tsx",
  "app/estudiar/b1/page.tsx",
  "app/estudiar/b1/[unitId]/page.tsx",
  "app/estudiar/b2/page.tsx",
  "app/estudiar/b2/[unitId]/page.tsx",
  "components/study/block-unit-list.tsx",
  "components/study/block-study-index.tsx",
  "components/study/unit-study-reader.tsx",
  "components/study/study-content.tsx",
  "components/study/unit-progress-controls.tsx",
  "lib/content/study-content.ts",
  "lib/content/blocks.ts",
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

// Both blocks carry twelve canonical units with the same ids; the source
// version differs per block.
for (const block of [
  {
    dir: "block-1",
    version: "BLOCK1_CANONICAL_V1.0",
    versionedUnits: true,
    conceptHeading: "## Conceptos esenciales",
  },
  {
    dir: "block-2",
    version: null,
    versionedUnits: false,
    conceptHeading: "## Conceptos canónicos",
  },
]) {
  const units = JSON.parse(
    await readFile(
      path.join(root, "content", block.dir, "canonical", "units.json"),
      "utf8",
    ),
  );

  if (units.length !== 12) failures.push(`UNITS ${block.dir} expected 12, got ${units.length}`);

  for (let index = 0; index < 12; index += 1) {
    const unit = units[index];
    const expectedId = `U${String(index + 1).padStart(2, "0")}`;
    if (unit.unitId !== expectedId) failures.push(`UNIT_ID ${block.dir} expected ${expectedId}, got ${unit.unitId}`);
    if (unit.order !== index + 1) failures.push(`UNIT_ORDER ${block.dir} ${unit.unitId}`);
    if (block.versionedUnits && unit.sourceVersion !== block.version) {
      failures.push(`UNIT_SOURCE_VERSION ${block.dir} ${unit.unitId}`);
    }

    const markdown = await readFile(
      path.join(root, "content", block.dir, unit.canonicalFile),
      "utf8",
    );
    if (!markdown.includes("## Objetivo")) failures.push(`MISSING_OBJECTIVE ${block.dir} ${unit.unitId}`);
    if (!markdown.includes(block.conceptHeading)) failures.push(`MISSING_CONCEPT_SECTION ${block.dir} ${unit.unitId}`);
  }
}

const routeSource = await readFile(
  path.join(root, "app", "estudiar", "b1", "[unitId]", "page.tsx"),
  "utf8",
);
if (!routeSource.includes("generateStaticParams")) failures.push("STATIC_PARAMS missing");
if (!routeSource.includes("dynamicParams = false")) failures.push("DYNAMIC_PARAMS_GUARD missing");
if (!routeSource.includes("getAdjacentUnits")) failures.push("UNIT_NAVIGATION missing");

const b2RouteSource = await readFile(
  path.join(root, "app", "estudiar", "b2", "[unitId]", "page.tsx"),
  "utf8",
);
if (!b2RouteSource.includes("generateStaticParams")) failures.push("B2_STATIC_PARAMS missing");
if (!b2RouteSource.includes("dynamicParams = false")) failures.push("B2_DYNAMIC_PARAMS_GUARD missing");
if (!b2RouteSource.includes("getBlockAdjacentUnits")) failures.push("B2_UNIT_NAVIGATION missing");

// The reader and unit list are shared by both blocks, so the B1 route also
// renders the same reader UX while keeping the block in every link.
const readerSource = await readFile(
  path.join(root, "components", "study", "unit-study-reader.tsx"),
  "utf8",
);
if (!readerSource.includes("UnitProgressControls")) failures.push("UNIT_PROGRESS_CONTROLS missing");
if (!readerSource.includes("/tests?block=")) failures.push("UNIT_PRACTICE_LINK missing");
if (!readerSource.includes("unit.slug")) failures.push("UNIT_PRACTICE_SLUG missing");

const blockUnitListSource = await readFile(
  path.join(root, "components", "study", "block-unit-list.tsx"),
  "utf8",
);
if (!blockUnitListSource.includes("blockId")) failures.push("BLOCK_UNIT_LIST missing blockId");

const loaderSource = await readFile(
  path.join(root, "lib", "content", "study-content.ts"),
  "utf8",
);
if (!loaderSource.includes("readFile")) failures.push("DIRECT_CANONICAL_READ missing");
if (!loaderSource.includes("canonicalFile")) failures.push("UNIT_CANONICAL_FILE_LINK missing");
if (!loaderSource.includes("getBlockUnitBySlug")) failures.push("BLOCK_AWARE_STUDY_LOADER missing");

const blockPathsSource = await readFile(
  path.join(root, "lib", "content", "blocks.ts"),
  "utf8",
);
if (!blockPathsSource.includes('"block-1"') || !blockPathsSource.includes('"block-2"')) {
  failures.push("CANONICAL_ROOT missing");
}

const progressSource = await readFile(path.join(root, "lib", "storage", "unit-study-progress.ts"), "utf8");
for (const state of ["NOT_STARTED", "IN_PROGRESS", "STUDIED"]) {
  if (!progressSource.includes(state)) failures.push(`PROGRESS_STATE missing ${state}`);
}
if (!progressSource.includes("pp-study-progress-v1")) failures.push("PROGRESS_STORAGE_KEY missing");
if (!progressSource.includes("useSyncExternalStore")) failures.push("PROGRESS_EXTERNAL_STORE missing");

const testsPageSource = await readFile(path.join(root, "app", "tests", "page.tsx"), "utf8");
if (!testsPageSource.includes("QuizSetup")) failures.push("PRACTICE_CONTEXT_RECEIVER missing");

// The practice context (`/tests?block=b1&unit=uNN`, `/tests?mode=errors`) is
// resolved on the client because a static export cannot read request-time
// searchParams.
const quizSetupSource = await readFile(path.join(root, "components", "quiz", "quiz-setup.tsx"), "utf8");
for (const token of ["useClientSearchParams", 'searchParams.get("unit")', 'searchParams.get("mode")', 'searchParams.get("block")']) {
  if (!quizSetupSource.includes(token)) failures.push(`PRACTICE_CONTEXT_ROUTE missing ${token}`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("STUDY_VALIDATION=PASS");
console.log("BLOCKS=2/2");
console.log("UNIT_ROUTES=24/24");
console.log("CANONICAL_SOURCE=PASS");
console.log("UNIT_NAVIGATION=PASS");
console.log("UNIT_PROGRESS=PASS");
console.log("PRACTICE_CONTEXT=PASS");
