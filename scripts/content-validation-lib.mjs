import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const EXPECTED = {
  sourceVersion: "BLOCK1_CANONICAL_V1.0",
  conceptBankVersion: "B1_CONCEPT_BANK_V1.0",
  coverageMatrixVersion: "B1_TEST_MATRIX_V1.0",
  testBankVersion: "BLOCK1_TEST_BANK_V1.0",
  flashcardBankVersion: "BLOCK1_FLASHCARD_BANK_V1.0",
  units: 12,
  concepts: 56,
  questions: 200,
  flashcards: 80,
};

function normalizePrompt(value) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("es");
}

function countBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = String(keyFn(item));
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}


export async function loadBlock1(root = process.cwd()) {
  const blockRoot = path.join(root, "content", "block-1");
  const manifest = JSON.parse(await readFile(path.join(blockRoot, "manifest.json"), "utf8"));
  const units = JSON.parse(await readFile(path.join(blockRoot, manifest.unit_index), "utf8"));
  const concepts = JSON.parse(await readFile(path.join(blockRoot, manifest.concept_file), "utf8"));
  const matrix = JSON.parse(await readFile(path.join(blockRoot, manifest.coverage_file), "utf8"));

  const questionGroups = [];
  for (const rel of manifest.question_files) {
    const data = JSON.parse(await readFile(path.join(blockRoot, rel), "utf8"));
    questionGroups.push(...data);
  }

  const flashcardGroups = [];
  for (const rel of manifest.flashcard_files) {
    const data = JSON.parse(await readFile(path.join(blockRoot, rel), "utf8"));
    flashcardGroups.push(...data);
  }

  const flashcardMatrix = JSON.parse(await readFile(path.join(blockRoot, manifest.flashcard_coverage_file), "utf8"));
  const integrity = JSON.parse(await readFile(path.join(blockRoot, "integrity.json"), "utf8"));

  return {
    root,
    blockRoot,
    manifest,
    units,
    concepts,
    questions: questionGroups,
    flashcards: flashcardGroups,
    matrix,
    flashcardMatrix,
    integrity,
  };
}

export async function validateBlock1(root = process.cwd()) {
  const data = await loadBlock1(root);
  const failures = [];
  const {
    blockRoot,
    manifest,
    units,
    concepts,
    questions,
    flashcards,
    matrix,
    flashcardMatrix,
    integrity,
  } = data;

  const fail = (message) => failures.push(message);

  // Manifest and authorities
  if (manifest.block_id !== "B1") fail(`MANIFEST block_id expected B1, got ${manifest.block_id}`);
  if (manifest.units !== EXPECTED.units) fail(`MANIFEST units expected ${EXPECTED.units}, got ${manifest.units}`);
  if (manifest.concepts !== EXPECTED.concepts) fail(`MANIFEST concepts expected ${EXPECTED.concepts}, got ${manifest.concepts}`);
  if (manifest.questions !== EXPECTED.questions) fail(`MANIFEST questions expected ${EXPECTED.questions}, got ${manifest.questions}`);
  if (manifest.flashcards !== EXPECTED.flashcards) fail(`MANIFEST flashcards expected ${EXPECTED.flashcards}, got ${manifest.flashcards}`);
  if (manifest.canonical_version !== EXPECTED.sourceVersion) fail("MANIFEST canonical_version mismatch");
  if (manifest.concept_bank_version !== EXPECTED.conceptBankVersion) fail("MANIFEST concept_bank_version mismatch");
  if (manifest.coverage_matrix_version !== EXPECTED.coverageMatrixVersion) fail("MANIFEST coverage_matrix_version mismatch");
  if (manifest.test_bank_version !== EXPECTED.testBankVersion) fail("MANIFEST test_bank_version mismatch");
  if (manifest.flashcard_bank_version !== EXPECTED.flashcardBankVersion) fail("MANIFEST flashcard_bank_version mismatch");
  if (manifest.flashcard_coverage_version !== "B1_FLASHCARD_MATRIX_V1.0") fail("MANIFEST flashcard_coverage_version mismatch");
  if (manifest.content_import_status !== "IMPORTED_PHASE_2") fail("MANIFEST content_import_status must be IMPORTED_PHASE_2");

  // Unit index + canonical markdown
  if (units.length !== EXPECTED.units) fail(`UNITS expected ${EXPECTED.units}, got ${units.length}`);
  const unitIds = new Set(units.map((unit) => unit.unitId));
  const expectedUnitIds = Array.from({ length: 12 }, (_, i) => `U${String(i + 1).padStart(2, "0")}`);
  for (const expectedId of expectedUnitIds) {
    if (!unitIds.has(expectedId)) fail(`UNIT missing ${expectedId}`);
  }

  const unitOrders = units.map((unit) => unit.order).sort((a, b) => a - b);
  if (unitOrders.join(",") !== "1,2,3,4,5,6,7,8,9,10,11,12") {
    fail(`UNIT order invalid: ${unitOrders.join(",")}`);
  }

  for (const unit of units) {
    if (unit.blockId !== "B1") fail(`UNIT ${unit.unitId} blockId mismatch`);
    if (unit.sourceVersion !== EXPECTED.sourceVersion) fail(`UNIT ${unit.unitId} sourceVersion mismatch`);
    if (unit.status !== "ACTIVE") fail(`UNIT ${unit.unitId} status must be ACTIVE`);
    const canonicalPath = path.join(blockRoot, unit.canonicalFile);
    const source = await readFile(canonicalPath, "utf8").catch(() => null);
    if (!source) {
      fail(`UNIT ${unit.unitId} canonical file missing: ${unit.canonicalFile}`);
    } else {
      if (!source.includes(`# ${unit.unitId} — ${unit.title}`)) fail(`UNIT ${unit.unitId} heading mismatch`);
      if (source.trim().length < 250) fail(`UNIT ${unit.unitId} canonical file unexpectedly short`);
    }
  }

  // Concepts
  if (concepts.length !== EXPECTED.concepts) fail(`CONCEPTS expected ${EXPECTED.concepts}, got ${concepts.length}`);
  const conceptIds = concepts.map((concept) => concept.conceptId);
  const conceptSet = new Set(conceptIds);
  if (conceptSet.size !== conceptIds.length) fail("CONCEPT duplicate IDs");

  for (const concept of concepts) {
    if (!unitIds.has(concept.unitId)) fail(`CONCEPT ${concept.conceptId} invalid unit ${concept.unitId}`);
    if (!concept.conceptId.startsWith(`B1-${concept.unitId}-`)) fail(`CONCEPT ${concept.conceptId} does not match unit ${concept.unitId}`);
    if (concept.blockId !== "B1") fail(`CONCEPT ${concept.conceptId} blockId mismatch`);
    if (!concept.name?.trim()) fail(`CONCEPT ${concept.conceptId} missing name`);
    if (!concept.definition?.trim()) fail(`CONCEPT ${concept.conceptId} missing definition`);
    if (concept.difficultyMin > concept.difficultyMax) fail(`CONCEPT ${concept.conceptId} invalid difficulty range`);
    if (concept.sourceVersion !== EXPECTED.sourceVersion) fail(`CONCEPT ${concept.conceptId} sourceVersion mismatch`);
    if (concept.status !== "ACTIVE") fail(`CONCEPT ${concept.conceptId} status must be ACTIVE`);
  }

  // Questions
  if (questions.length !== EXPECTED.questions) fail(`QUESTIONS expected ${EXPECTED.questions}, got ${questions.length}`);
  const qIds = questions.map((q) => q.id);
  const qSet = new Set(qIds);
  if (qSet.size !== qIds.length) fail("QUESTION duplicate IDs");
  const expectedQIds = Array.from({ length: EXPECTED.questions }, (_, i) => `B1-Q${String(i + 1).padStart(4, "0")}`);
  for (let i = 0; i < expectedQIds.length; i += 1) {
    if (qIds[i] !== expectedQIds[i]) fail(`QUESTION continuity expected ${expectedQIds[i]} at index ${i}, got ${qIds[i]}`);
  }

  const seenPrompt = new Set();
  for (const q of questions) {
    if (!unitIds.has(q.unitId)) fail(`QUESTION ${q.id} invalid unit ${q.unitId}`);
    if (!conceptSet.has(q.primaryConceptId)) fail(`QUESTION ${q.id} invalid primary concept ${q.primaryConceptId}`);
    if (!q.primaryConceptId.startsWith(`B1-${q.unitId}-`)) fail(`QUESTION ${q.id} primary concept/unit mismatch`);
    for (const secondary of q.secondaryConceptIds ?? []) {
      if (!conceptSet.has(secondary)) fail(`QUESTION ${q.id} invalid secondary concept ${secondary}`);
    }
    if (!["A", "B", "C", "D", "E", "F"].includes(q.type)) fail(`QUESTION ${q.id} invalid type ${q.type}`);
    if (![1, 2, 3].includes(q.difficulty)) fail(`QUESTION ${q.id} invalid difficulty ${q.difficulty}`);
    if (!q.prompt?.trim()) fail(`QUESTION ${q.id} empty prompt`);
    if (!q.explanation?.trim()) fail(`QUESTION ${q.id} empty explanation`);
    if (!Array.isArray(q.options) || q.options.length !== 4) fail(`QUESTION ${q.id} must have 4 options`);
    const optionIds = new Set((q.options ?? []).map((o) => o.id));
    if (optionIds.size !== 4 || !["opt_1", "opt_2", "opt_3", "opt_4"].every((id) => optionIds.has(id))) {
      fail(`QUESTION ${q.id} invalid option IDs`);
    }
    const optionTexts = (q.options ?? []).map((o) => o.text?.trim());
    if (optionTexts.some((text) => !text)) fail(`QUESTION ${q.id} empty option`);
    if (new Set(optionTexts).size !== optionTexts.length) fail(`QUESTION ${q.id} duplicate option text`);
    if (!optionIds.has(q.correctOptionId)) fail(`QUESTION ${q.id} correct option missing`);
    if (q.sourceVersion !== EXPECTED.sourceVersion) fail(`QUESTION ${q.id} sourceVersion mismatch`);
    if (q.conceptBankVersion !== EXPECTED.conceptBankVersion) fail(`QUESTION ${q.id} conceptBankVersion mismatch`);
    if (q.testBankVersion !== EXPECTED.testBankVersion) fail(`QUESTION ${q.id} testBankVersion mismatch`);
    if (q.status !== "ACTIVE") fail(`QUESTION ${q.id} status must be ACTIVE`);

    const normalized = normalizePrompt(q.prompt);
    if (seenPrompt.has(normalized)) fail(`QUESTION exact semantic duplicate prompt: ${q.id}`);
    seenPrompt.add(normalized);
  }

  // Question global quotas
  const computedTypes = countBy(questions, (q) => q.type);
  const computedDifficulty = countBy(questions, (q) => q.difficulty);
  const computedPositions = countBy(questions, (q) => q.correctOptionId);

  for (const [key, value] of Object.entries(matrix.global.types)) {
    if ((computedTypes[key] ?? 0) !== value) fail(`QUESTION type ${key} expected ${value}, got ${computedTypes[key] ?? 0}`);
  }
  for (const [key, value] of Object.entries(matrix.global.difficulty)) {
    if ((computedDifficulty[key] ?? 0) !== value) fail(`QUESTION difficulty ${key} expected ${value}, got ${computedDifficulty[key] ?? 0}`);
  }
  for (const [key, value] of Object.entries(matrix.global.answerPositions)) {
    if ((computedPositions[key] ?? 0) !== value) fail(`QUESTION answer position ${key} expected ${value}, got ${computedPositions[key] ?? 0}`);
  }

  // Unit and concept quotas
  for (const [unitId, expected] of Object.entries(matrix.units)) {
    const unitQuestions = questions.filter((q) => q.unitId === unitId);
    if (unitQuestions.length !== expected.count) fail(`UNIT ${unitId} question count expected ${expected.count}, got ${unitQuestions.length}`);

    const unitTypes = countBy(unitQuestions, (q) => q.type);
    for (const [type, count] of Object.entries(expected.types)) {
      if ((unitTypes[type] ?? 0) !== count) fail(`UNIT ${unitId} type ${type} expected ${count}, got ${unitTypes[type] ?? 0}`);
    }

    const unitDifficulty = countBy(unitQuestions, (q) => q.difficulty);
    for (const [difficulty, count] of Object.entries(expected.difficulty)) {
      if ((unitDifficulty[difficulty] ?? 0) !== count) fail(`UNIT ${unitId} difficulty ${difficulty} expected ${count}, got ${unitDifficulty[difficulty] ?? 0}`);
    }
  }

  for (const [conceptId, expected] of Object.entries(matrix.concepts)) {
    const conceptQuestions = questions.filter((q) => q.primaryConceptId === conceptId);
    if (conceptQuestions.length !== expected.count) fail(`CONCEPT ${conceptId} question count expected ${expected.count}, got ${conceptQuestions.length}`);

    const types = countBy(conceptQuestions, (q) => q.type);
    for (const [type, count] of Object.entries(expected.types)) {
      if ((types[type] ?? 0) !== count) fail(`CONCEPT ${conceptId} type ${type} expected ${count}, got ${types[type] ?? 0}`);
    }

    const difficulty = countBy(conceptQuestions, (q) => q.difficulty);
    for (const [level, count] of Object.entries(expected.difficulty)) {
      if ((difficulty[level] ?? 0) !== count) fail(`CONCEPT ${conceptId} difficulty ${level} expected ${count}, got ${difficulty[level] ?? 0}`);
    }
  }

  const questionCoveredConcepts = new Set(questions.map((q) => q.primaryConceptId));
  for (const conceptId of conceptSet) {
    if (!questionCoveredConcepts.has(conceptId)) fail(`CONCEPT ${conceptId} has no primary question coverage`);
  }

  // Flashcards
  if (flashcards.length !== EXPECTED.flashcards) fail(`FLASHCARDS expected ${EXPECTED.flashcards}, got ${flashcards.length}`);
  const fcIds = flashcards.map((fc) => fc.id);
  const fcSet = new Set(fcIds);
  if (fcSet.size !== fcIds.length) fail("FLASHCARD duplicate IDs");
  const expectedFcIds = Array.from({ length: EXPECTED.flashcards }, (_, i) => `B1-FC${String(i + 1).padStart(4, "0")}`);
  for (let i = 0; i < expectedFcIds.length; i += 1) {
    if (fcIds[i] !== expectedFcIds[i]) fail(`FLASHCARD continuity expected ${expectedFcIds[i]} at index ${i}, got ${fcIds[i]}`);
  }

  for (const fc of flashcards) {
    if (!unitIds.has(fc.unitId)) fail(`FLASHCARD ${fc.id} invalid unit ${fc.unitId}`);
    if (!conceptSet.has(fc.primaryConceptId)) fail(`FLASHCARD ${fc.id} invalid primary concept ${fc.primaryConceptId}`);
    if (!fc.primaryConceptId.startsWith(`B1-${fc.unitId}-`)) fail(`FLASHCARD ${fc.id} primary concept/unit mismatch`);
    for (const secondary of fc.secondaryConceptIds ?? []) {
      if (!conceptSet.has(secondary)) fail(`FLASHCARD ${fc.id} invalid secondary concept ${secondary}`);
    }
    if (!["CD", "CM", "CR", "EC", "PX"].includes(fc.type)) fail(`FLASHCARD ${fc.id} invalid type ${fc.type}`);
    if (!fc.front?.trim()) fail(`FLASHCARD ${fc.id} empty front`);
    if (!fc.back?.trim()) fail(`FLASHCARD ${fc.id} empty back`);
    if (typeof fc.reversible !== "boolean") fail(`FLASHCARD ${fc.id} reversible must be boolean`);
    if (fc.sourceVersion !== EXPECTED.sourceVersion) fail(`FLASHCARD ${fc.id} sourceVersion mismatch`);
    if (fc.conceptBankVersion !== EXPECTED.conceptBankVersion) fail(`FLASHCARD ${fc.id} conceptBankVersion mismatch`);
    if (fc.flashcardBankVersion !== EXPECTED.flashcardBankVersion) fail(`FLASHCARD ${fc.id} flashcardBankVersion mismatch`);
    if (fc.status !== "ACTIVE") fail(`FLASHCARD ${fc.id} status must be ACTIVE`);
  }

  const flashcardCovered = new Set();
  for (const fc of flashcards) {
    flashcardCovered.add(fc.primaryConceptId);
    for (const secondary of fc.secondaryConceptIds ?? []) flashcardCovered.add(secondary);
  }
  for (const conceptId of conceptSet) {
    if (!flashcardCovered.has(conceptId)) fail(`CONCEPT ${conceptId} has no flashcard coverage`);
  }

  if (flashcardMatrix.version !== "B1_FLASHCARD_MATRIX_V1.0") fail("FLASHCARD_MATRIX version mismatch");
  if (flashcardMatrix.flashcards !== EXPECTED.flashcards) fail(`FLASHCARD_MATRIX count expected ${EXPECTED.flashcards}, got ${flashcardMatrix.flashcards}`);
  const computedFlashcardUnits = countBy(flashcards, (fc) => fc.unitId);
  const computedFlashcardTypes = countBy(flashcards, (fc) => fc.type);
  const computedFlashcardLanguages = countBy(flashcards, (fc) => fc.language);
  for (const [key, value] of Object.entries(flashcardMatrix.units)) {
    if ((computedFlashcardUnits[key] ?? 0) !== value) fail(`FLASHCARD unit ${key} expected ${value}, got ${computedFlashcardUnits[key] ?? 0}`);
  }
  for (const [key, value] of Object.entries(flashcardMatrix.types)) {
    if ((computedFlashcardTypes[key] ?? 0) !== value) fail(`FLASHCARD type ${key} expected ${value}, got ${computedFlashcardTypes[key] ?? 0}`);
  }
  for (const [key, value] of Object.entries(flashcardMatrix.languages)) {
    if ((computedFlashcardLanguages[key] ?? 0) !== value) fail(`FLASHCARD language ${key} expected ${value}, got ${computedFlashcardLanguages[key] ?? 0}`);
  }
  if (flashcardCovered.size !== flashcardMatrix.conceptCoverage) {
    fail(`FLASHCARD concept coverage expected ${flashcardMatrix.conceptCoverage}, got ${flashcardCovered.size}`);
  }

  // Integrity checks
  if (integrity.algorithm !== "sha256") fail("INTEGRITY algorithm must be sha256");
  const integrityEntries = Object.entries(integrity.files ?? {});
  if (!integrityEntries.length) fail("INTEGRITY file list is empty");

  for (const [rel, expectedHash] of integrityEntries) {
    const bytes = await readFile(path.join(blockRoot, rel)).catch(() => null);
    if (!bytes) {
      fail(`INTEGRITY missing file ${rel}`);
      continue;
    }
    const actual = createHash("sha256").update(bytes).digest("hex").toUpperCase();
    if (actual !== expectedHash) fail(`INTEGRITY hash mismatch ${rel}`);
  }

  return {
    ok: failures.length === 0,
    failures,
    metrics: {
      units: units.length,
      concepts: concepts.length,
      questions: questions.length,
      flashcards: flashcards.length,
      types: computedTypes,
      difficulty: computedDifficulty,
      answerPositions: computedPositions,
    },
  };
}
