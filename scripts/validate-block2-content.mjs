// Validador autocontenido de contenido de Bloque 2 (B2).
// Valida unicamente content/block-2 y no altera el comportamiento de la validacion de B1.
// Uso: node scripts/validate-block2-content.mjs
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BLOCK = path.join(ROOT, "content", "block-2");

const EXPECTED = {
  blockId: "B2",
  title: "Automatización práctica con archivos y datos",
  sourceVersion: "BLOCK2_CANONICAL_V1.0",
  conceptBankVersion: "B2_CONCEPT_BANK_V1.0",
  coverageMatrixVersion: "B2_TEST_MATRIX_V1.0",
  testBankVersion: "BLOCK2_TEST_BANK_V1.0",
  flashcardBankVersion: "BLOCK2_FLASHCARD_BANK_V1.0",
  flashcardMatrixVersion: "B2_FLASHCARD_MATRIX_V1.0",
  snippetInventoryVersion: "B2_SNIPPET_INVENTORY_V1.0",
  snippetRegistryVersion: "B2_SNIPPET_CASES_V1.0",
  units: 12,
  concepts: 72,
  questions: 240,
  flashcards: 96,
  perUnitQuestions: 20,
  perUnitFlashcards: 8,
  difficulties: { 1: 60, 2: 108, 3: 72 },
  perUnitDifficulty: { 1: 5, 2: 9, 3: 6 },
  answerPositions: { opt_1: 60, opt_2: 60, opt_3: 60, opt_4: 60 },
  minPrimaryQuestions: 3,
  minPrimaryFlashcards: 1,
};

const UNIT_IDS = Array.from({ length: 12 }, (_, i) => `U${String(i + 1).padStart(2, "0")}`);
const QUESTION_TYPES = ["A", "B", "C", "D", "E", "F"];
const FLASHCARD_TYPES = ["CD", "CM", "CR", "EC", "PX"];
const LANGUAGES = ["COMMON", "PYTHON", "POWERSHELL", "PYTHON_POWERSHELL"];
const COMPETENCIES = ["R", "I", "A", "D"];
const PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM"];

const readJson = async (rel) => JSON.parse(await readFile(path.join(BLOCK, rel), "utf8"));

function normalize(value) {
  return String(value).replace(/\s+/g, " ").trim().toLocaleLowerCase("es");
}

function countBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = String(keyFn(item));
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

function sortKeys(obj) {
  const out = {};
  for (const key of Object.keys(obj).sort()) out[key] = obj[key];
  return out;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function computeTestMatrix(concepts, questions) {
  const matrix = {
    version: EXPECTED.coverageMatrixVersion,
    questions: questions.length,
    global: {
      types: sortKeys(countBy(questions, (q) => q.type)),
      difficulty: sortKeys(countBy(questions, (q) => q.difficulty)),
      answerPositions: sortKeys(countBy(questions, (q) => q.correctOptionId)),
      languages: sortKeys(countBy(questions, (q) => q.language)),
    },
    units: {},
    concepts: {},
    conceptCoverage: {},
  };
  for (const unitId of UNIT_IDS) {
    const uq = questions.filter((q) => q.unitId === unitId);
    matrix.units[unitId] = {
      count: uq.length,
      types: sortKeys(countBy(uq, (q) => q.type)),
      difficulty: sortKeys(countBy(uq, (q) => q.difficulty)),
      answerPositions: sortKeys(countBy(uq, (q) => q.correctOptionId)),
      languages: sortKeys(countBy(uq, (q) => q.language)),
    };
  }
  const primaryCounts = countBy(questions, (q) => q.primaryConceptId);
  for (const c of concepts) {
    const cq = questions.filter((q) => q.primaryConceptId === c.conceptId);
    matrix.concepts[c.conceptId] = {
      unitId: c.unitId,
      count: cq.length,
      types: sortKeys(countBy(cq, (q) => q.type)),
      difficulty: sortKeys(countBy(cq, (q) => q.difficulty)),
    };
  }
  matrix.conceptCoverage = {
    totalConcepts: concepts.length,
    requiredPrimaryMin: EXPECTED.minPrimaryQuestions,
    minPrimary: Math.min(...concepts.map((c) => primaryCounts[c.conceptId] ?? 0)),
    maxPrimary: Math.max(...concepts.map((c) => primaryCounts[c.conceptId] ?? 0)),
    conceptsWithMinPrimary: concepts.filter((c) => (primaryCounts[c.conceptId] ?? 0) >= EXPECTED.minPrimaryQuestions).length,
  };
  return matrix;
}

function computeFlashcardMatrix(concepts, flashcards) {
  return {
    version: EXPECTED.flashcardMatrixVersion,
    flashcards: flashcards.length,
    units: sortKeys(countBy(flashcards, (fc) => fc.unitId)),
    types: sortKeys(countBy(flashcards, (fc) => fc.type)),
    languages: sortKeys(countBy(flashcards, (fc) => fc.language)),
    reversible: sortKeys(countBy(flashcards, (fc) => fc.reversible)),
    conceptCoverage: concepts.filter((c) => flashcards.some((fc) => fc.primaryConceptId === c.conceptId)).length,
    primaryCounts: sortKeys(countBy(flashcards, (fc) => fc.primaryConceptId)),
    rules: {
      types: FLASHCARD_TYPES,
      requiredConceptCoverage: "primary",
      reversibleOnlyWhenUnambiguous: true,
    },
  };
}

async function main() {
  const failures = [];
  const fail = (message) => failures.push(message);

  const manifest = await readJson("manifest.json");
  const units = await readJson("canonical/units.json");
  const concepts = await readJson("concepts/concepts.json");
  const questions = [];
  const flashcards = [];
  for (const unitId of UNIT_IDS) {
    questions.push(...(await readJson(`questions/${unitId.toLowerCase()}.json`)));
    flashcards.push(...(await readJson(`flashcards/${unitId.toLowerCase()}.json`)));
  }
  const testMatrix = await readJson("coverage/test-matrix.json");
  const flashcardMatrix = await readJson("coverage/flashcard-matrix.json");
  const integrity = await readJson("integrity.json");

  // ---- Manifest ----
  if (manifest.block_id !== EXPECTED.blockId) fail(`MANIFEST block_id expected ${EXPECTED.blockId}, got ${manifest.block_id}`);
  if (manifest.title !== EXPECTED.title) fail(`MANIFEST title mismatch: ${manifest.title}`);
  if (manifest.canonical_version !== EXPECTED.sourceVersion) fail("MANIFEST canonical_version mismatch");
  if (manifest.concept_bank_version !== EXPECTED.conceptBankVersion) fail("MANIFEST concept_bank_version mismatch");
  if (manifest.coverage_matrix_version !== EXPECTED.coverageMatrixVersion) fail("MANIFEST coverage_matrix_version mismatch");
  if (manifest.test_bank_version !== EXPECTED.testBankVersion) fail("MANIFEST test_bank_version mismatch");
  if (manifest.flashcard_bank_version !== EXPECTED.flashcardBankVersion) fail("MANIFEST flashcard_bank_version mismatch");
  if (manifest.flashcard_coverage_version !== EXPECTED.flashcardMatrixVersion) fail("MANIFEST flashcard_coverage_version mismatch");
  if (manifest.snippet_inventory_version !== EXPECTED.snippetInventoryVersion) fail("MANIFEST snippet_inventory_version mismatch");
  if (manifest.snippet_registry_version !== EXPECTED.snippetRegistryVersion) fail("MANIFEST snippet_registry_version mismatch");
  if (manifest.snippet_registry_file !== "snippets/snippet-cases.json") fail("MANIFEST snippet_registry_file mismatch");
  if (manifest.snippet_inventory_file !== "snippets/inventory.json") fail("MANIFEST snippet_inventory_file mismatch");
  if (manifest.units !== EXPECTED.units) fail(`MANIFEST units expected ${EXPECTED.units}, got ${manifest.units}`);
  if (manifest.concepts !== EXPECTED.concepts) fail(`MANIFEST concepts expected ${EXPECTED.concepts}, got ${manifest.concepts}`);
  if (manifest.questions !== EXPECTED.questions) fail(`MANIFEST questions expected ${EXPECTED.questions}, got ${manifest.questions}`);
  if (manifest.flashcards !== EXPECTED.flashcards) fail(`MANIFEST flashcards expected ${EXPECTED.flashcards}, got ${manifest.flashcards}`);
  if (manifest.language !== "es") fail(`MANIFEST language expected es, got ${manifest.language}`);
  const pubText = `${manifest.status ?? ""} ${manifest.publication_status ?? ""}`.toUpperCase();
  if (!pubText.includes("NOT_PUBLISHED")) fail("MANIFEST must state it is not published to the web");
  if (!pubText.includes("BRANCH")) fail("MANIFEST must state it is developed on a branch");
  if (manifest.repository_branch !== "content/block-2-canonical-v1") fail("MANIFEST repository_branch mismatch");

  // ---- Units ----
  if (units.length !== EXPECTED.units) fail(`UNITS expected ${EXPECTED.units}, got ${units.length}`);
  const unitIds = new Set(units.map((u) => u.unitId));
  for (const unitId of UNIT_IDS) if (!unitIds.has(unitId)) fail(`UNIT missing ${unitId}`);
  for (const unit of units) {
    if (unit.blockId !== EXPECTED.blockId) fail(`UNIT ${unit.unitId} blockId mismatch`);
    if (!Array.isArray(unit.conceptIds) || unit.conceptIds.length !== 6) fail(`UNIT ${unit.unitId} must list 6 conceptIds`);
  }

  // ---- Concepts ----
  if (concepts.length !== EXPECTED.concepts) fail(`CONCEPTS expected ${EXPECTED.concepts}, got ${concepts.length}`);
  const conceptIds = concepts.map((c) => c.conceptId);
  const conceptSet = new Set(conceptIds);
  if (conceptSet.size !== conceptIds.length) fail("CONCEPT duplicate IDs");
  const declaredConceptIds = new Set(units.flatMap((u) => u.conceptIds));
  if (declaredConceptIds.size !== EXPECTED.concepts) fail(`UNITS declare ${declaredConceptIds.size} conceptIds, expected ${EXPECTED.concepts}`);
  for (const concept of concepts) {
    const where = `CONCEPT ${concept.conceptId}`;
    if (!unitIds.has(concept.unitId)) fail(`${where} invalid unit ${concept.unitId}`);
    if (!concept.conceptId.startsWith(`B2-${concept.unitId}-`)) fail(`${where} does not match unit ${concept.unitId}`);
    if (concept.blockId !== EXPECTED.blockId) fail(`${where} blockId mismatch`);
    if (!declaredConceptIds.has(concept.conceptId)) fail(`${where} not declared in canonical/units.json`);
    if (!concept.name?.trim()) fail(`${where} missing name`);
    if (!concept.definition?.trim() || concept.definition.trim().length < 20) fail(`${where} definition too short`);
    if (!LANGUAGES.includes(concept.language)) fail(`${where} invalid language ${concept.language}`);
    if (!PRIORITIES.includes(concept.priority)) fail(`${where} invalid priority ${concept.priority}`);
    if (![1, 2, 3].includes(concept.difficultyMin) || ![1, 2, 3].includes(concept.difficultyMax)) fail(`${where} invalid difficulty range`);
    if (concept.difficultyMin > concept.difficultyMax) fail(`${where} difficultyMin > difficultyMax`);
    if (!Array.isArray(concept.competencies) || concept.competencies.length < 1) fail(`${where} missing competencies`);
    if ((concept.competencies ?? []).some((c) => !COMPETENCIES.includes(c))) fail(`${where} invalid competency`);
    if (new Set(concept.competencies ?? []).size !== (concept.competencies ?? []).length) fail(`${where} duplicate competencies`);
    if (concept.sourceVersion !== EXPECTED.sourceVersion) fail(`${where} sourceVersion mismatch`);
    if (concept.status !== "ACTIVE") fail(`${where} status must be ACTIVE`);
  }

  // ---- Questions ----
  if (questions.length !== EXPECTED.questions) fail(`QUESTIONS expected ${EXPECTED.questions}, got ${questions.length}`);
  const qIds = questions.map((q) => q.id);
  if (new Set(qIds).size !== qIds.length) fail("QUESTION duplicate IDs");
  const expectedQIds = Array.from({ length: EXPECTED.questions }, (_, i) => `B2-Q${String(i + 1).padStart(4, "0")}`);
  for (let i = 0; i < expectedQIds.length; i += 1) {
    if (qIds[i] !== expectedQIds[i]) fail(`QUESTION continuity expected ${expectedQIds[i]} at index ${i}, got ${qIds[i]}`);
  }
  const seenPrompt = new Map();
  for (const q of questions) {
    const where = `QUESTION ${q.id}`;
    if (!unitIds.has(q.unitId)) fail(`${where} invalid unit ${q.unitId}`);
    if (q.blockId !== EXPECTED.blockId) fail(`${where} blockId mismatch`);
    if (!conceptSet.has(q.primaryConceptId)) fail(`${where} invalid primary concept ${q.primaryConceptId}`);
    if (!q.primaryConceptId.startsWith(`B2-${q.unitId}-`)) fail(`${where} primary concept/unit mismatch`);
    const secondary = q.secondaryConceptIds ?? [];
    if (new Set(secondary).size !== secondary.length) fail(`${where} duplicate secondary concepts`);
    for (const s of secondary) if (!conceptSet.has(s)) fail(`${where} invalid secondary concept ${s}`);
    if (!QUESTION_TYPES.includes(q.type)) fail(`${where} invalid type ${q.type}`);
    if (![1, 2, 3].includes(q.difficulty)) fail(`${where} invalid difficulty ${q.difficulty}`);
    if (!LANGUAGES.includes(q.language)) fail(`${where} invalid language ${q.language}`);
    if (!q.prompt?.trim()) fail(`${where} empty prompt`);
    if (!q.explanation?.trim()) fail(`${where} empty explanation`);
    if (!Array.isArray(q.options) || q.options.length !== 4) fail(`${where} must have 4 options`);
    const optionIds = new Set((q.options ?? []).map((o) => o.id));
    if (optionIds.size !== 4 || !["opt_1", "opt_2", "opt_3", "opt_4"].every((id) => optionIds.has(id))) {
      fail(`${where} invalid option IDs`);
    }
    const texts = (q.options ?? []).map((o) => o.text?.trim() ?? "");
    if (texts.some((t) => !t)) fail(`${where} empty option text`);
    if (new Set(texts.map(normalize)).size !== texts.length) fail(`${where} duplicate option text`);
    if (!optionIds.has(q.correctOptionId)) fail(`${where} correctOptionId missing`);
    if (q.sourceVersion !== EXPECTED.sourceVersion) fail(`${where} sourceVersion mismatch`);
    if (q.conceptBankVersion !== EXPECTED.conceptBankVersion) fail(`${where} conceptBankVersion mismatch`);
    if (q.testBankVersion !== EXPECTED.testBankVersion) fail(`${where} testBankVersion mismatch`);
    if (q.status !== "ACTIVE") fail(`${where} status must be ACTIVE`);

    const np = normalize(q.prompt);
    if (seenPrompt.has(np)) fail(`QUESTION duplicate prompt ${q.id} <-> ${seenPrompt.get(np)}`);
    else seenPrompt.set(np, q.id);
  }

  // Difficulty per unit and global
  const globalDifficulty = countBy(questions, (q) => q.difficulty);
  for (const [level, expected] of Object.entries(EXPECTED.difficulties)) {
    if ((globalDifficulty[level] ?? 0) !== expected) fail(`GLOBAL difficulty ${level} expected ${expected}, got ${globalDifficulty[level] ?? 0}`);
  }
  for (const unitId of UNIT_IDS) {
    const uq = questions.filter((q) => q.unitId === unitId);
    if (uq.length !== EXPECTED.perUnitQuestions) fail(`UNIT ${unitId} questions expected ${EXPECTED.perUnitQuestions}, got ${uq.length}`);
    const ud = countBy(uq, (q) => q.difficulty);
    for (const [level, expected] of Object.entries(EXPECTED.perUnitDifficulty)) {
      if ((ud[level] ?? 0) !== expected) fail(`UNIT ${unitId} difficulty ${level} expected ${expected}, got ${ud[level] ?? 0}`);
    }
  }
  const globalPositions = countBy(questions, (q) => q.correctOptionId);
  for (const [pos, expected] of Object.entries(EXPECTED.answerPositions)) {
    if ((globalPositions[pos] ?? 0) !== expected) fail(`GLOBAL answer position ${pos} expected ${expected}, got ${globalPositions[pos] ?? 0}`);
  }

  // Concept question coverage
  const primaryQCounts = countBy(questions, (q) => q.primaryConceptId);
  for (const conceptId of conceptSet) {
    if ((primaryQCounts[conceptId] ?? 0) < EXPECTED.minPrimaryQuestions) {
      fail(`CONCEPT ${conceptId} has ${primaryQCounts[conceptId] ?? 0} primary questions, expected >= ${EXPECTED.minPrimaryQuestions}`);
    }
  }

  // ---- Flashcards ----
  if (flashcards.length !== EXPECTED.flashcards) fail(`FLASHCARDS expected ${EXPECTED.flashcards}, got ${flashcards.length}`);
  const fcIds = flashcards.map((fc) => fc.id);
  if (new Set(fcIds).size !== fcIds.length) fail("FLASHCARD duplicate IDs");
  const expectedFcIds = Array.from({ length: EXPECTED.flashcards }, (_, i) => `B2-FC${String(i + 1).padStart(4, "0")}`);
  for (let i = 0; i < expectedFcIds.length; i += 1) {
    if (fcIds[i] !== expectedFcIds[i]) fail(`FLASHCARD continuity expected ${expectedFcIds[i]} at index ${i}, got ${fcIds[i]}`);
  }
  const seenFront = new Map();
  const seenBack = new Map();
  for (const fc of flashcards) {
    const where = `FLASHCARD ${fc.id}`;
    if (!unitIds.has(fc.unitId)) fail(`${where} invalid unit ${fc.unitId}`);
    if (fc.blockId !== EXPECTED.blockId) fail(`${where} blockId mismatch`);
    if (!conceptSet.has(fc.primaryConceptId)) fail(`${where} invalid primary concept ${fc.primaryConceptId}`);
    if (!fc.primaryConceptId.startsWith(`B2-${fc.unitId}-`)) fail(`${where} primary concept/unit mismatch`);
    const secondary = fc.secondaryConceptIds ?? [];
    if (new Set(secondary).size !== secondary.length) fail(`${where} duplicate secondary concepts`);
    for (const s of secondary) if (!conceptSet.has(s)) fail(`${where} invalid secondary concept ${s}`);
    if (!FLASHCARD_TYPES.includes(fc.type)) fail(`${where} invalid type ${fc.type}`);
    if (!LANGUAGES.includes(fc.language)) fail(`${where} invalid language ${fc.language}`);
    if (!fc.front?.trim()) fail(`${where} empty front`);
    if (!fc.back?.trim()) fail(`${where} empty back`);
    if (typeof fc.reversible !== "boolean") fail(`${where} reversible must be boolean`);
    if (fc.sourceVersion !== EXPECTED.sourceVersion) fail(`${where} sourceVersion mismatch`);
    if (fc.conceptBankVersion !== EXPECTED.conceptBankVersion) fail(`${where} conceptBankVersion mismatch`);
    if (fc.flashcardBankVersion !== EXPECTED.flashcardBankVersion) fail(`${where} flashcardBankVersion mismatch`);
    if (fc.status !== "ACTIVE") fail(`${where} status must be ACTIVE`);

    const nf = normalize(fc.front);
    if (seenFront.has(nf)) fail(`FLASHCARD duplicate front ${fc.id} <-> ${seenFront.get(nf)}`);
    else seenFront.set(nf, fc.id);
    const nb = normalize(fc.back);
    if (seenBack.has(nb)) fail(`FLASHCARD duplicate back ${fc.id} <-> ${seenBack.get(nb)}`);
    else seenBack.set(nb, fc.id);
  }
  for (const unitId of UNIT_IDS) {
    const uf = flashcards.filter((fc) => fc.unitId === unitId);
    if (uf.length !== EXPECTED.perUnitFlashcards) fail(`UNIT ${unitId} flashcards expected ${EXPECTED.perUnitFlashcards}, got ${uf.length}`);
  }
  const primaryFcCounts = countBy(flashcards, (fc) => fc.primaryConceptId);
  for (const conceptId of conceptSet) {
    if ((primaryFcCounts[conceptId] ?? 0) < EXPECTED.minPrimaryFlashcards) {
      fail(`CONCEPT ${conceptId} has no primary flashcard`);
    }
  }

  // ---- Coverage matrices equal computed data ----
  const computedTest = computeTestMatrix(concepts, questions);
  if (canonical(computedTest) !== canonical(testMatrix)) fail("COVERAGE test-matrix.json does not match computed data");
  const computedFlashcard = computeFlashcardMatrix(concepts, flashcards);
  if (canonical(computedFlashcard) !== canonical(flashcardMatrix)) fail("COVERAGE flashcard-matrix.json does not match computed data");

  // ---- Integrity ----
  if (integrity.algorithm !== "sha256") fail("INTEGRITY algorithm must be sha256");
  const entries = Object.entries(integrity.files ?? {});
  if (!entries.length) fail("INTEGRITY file list is empty");
  for (const required of ["snippets/snippet-cases.json", "snippets/inventory.json"]) {
    if (!entries.some(([rel]) => rel === required)) fail(`INTEGRITY must cover ${required}`);
  }
  for (const [rel, expectedHash] of entries) {
    const bytes = await readFile(path.join(BLOCK, rel)).catch(() => null);
    if (!bytes) {
      fail(`INTEGRITY missing file ${rel}`);
      continue;
    }
    const actual = createHash("sha256").update(bytes).digest("hex").toUpperCase();
    if (actual !== expectedHash) fail(`INTEGRITY hash mismatch ${rel}`);
  }

  // ---- Report ----
  if (failures.length) {
    console.error("BLOCK2_CONTENT_VALIDATION=FAIL");
    for (const f of failures) console.error(`- ${f}`);
    process.exit(1);
  }

  console.log("BLOCK2_CONTENT_VALIDATION=PASS");
  console.log(`UNITS=${units.length}/12`);
  console.log(`CONCEPTS=${concepts.length}/72`);
  console.log(`QUESTIONS=${questions.length}/240`);
  console.log(`FLASHCARDS=${flashcards.length}/96`);
  console.log(`QUESTION_DIFFICULTY=${JSON.stringify(globalDifficulty)}`);
  console.log(`ANSWER_POSITIONS=${JSON.stringify(globalPositions)}`);
  console.log(`CONCEPT_Q_COVERAGE_MIN=${Math.min(...concepts.map((c) => primaryQCounts[c.conceptId] ?? 0))}`);
  console.log(`CONCEPT_FC_COVERAGE_MIN=${Math.min(...concepts.map((c) => primaryFcCounts[c.conceptId] ?? 0))}`);
  console.log("TRACEABILITY=PASS");
  console.log("COVERAGE_MATRICES=PASS");
  console.log("CONTENT_INTEGRITY=PASS");
}

main().catch((err) => {
  console.error("BLOCK2_CONTENT_VALIDATION=FAIL");
  console.error(err);
  process.exit(1);
});
