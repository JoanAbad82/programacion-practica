import { readFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const questionRoot = path.join(root, "content", "block-1", "questions");

export function hashSeed(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function deterministicShuffle(values, seed) {
  const output = [...values];
  const random = createRandom(seed);
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

export async function loadQuestions() {
  const groups = [];
  for (let index = 1; index <= 12; index += 1) {
    const file = `u${String(index).padStart(2, "0")}.json`;
    groups.push(
      JSON.parse(await readFile(path.join(questionRoot, file), "utf8")),
    );
  }
  return groups.flat();
}

export async function validateQuizEngine() {
  const failures = [];
  const questions = await loadQuestions();

  if (questions.length !== 200) {
    failures.push(`Expected 200 questions, got ${questions.length}`);
  }

  const ids = new Set();
  for (const question of questions) {
    if (ids.has(question.id)) failures.push(`Duplicate question ${question.id}`);
    ids.add(question.id);

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      failures.push(`${question.id} must have exactly four options`);
      continue;
    }

    const optionIds = new Set(question.options.map((option) => option.id));
    if (optionIds.size !== 4) {
      failures.push(`${question.id} option IDs are not unique`);
    }
    if (!optionIds.has(question.correctOptionId)) {
      failures.push(`${question.id} correct option is missing`);
    }

    const first = deterministicShuffle(
      question.options.map((option) => option.id),
      hashSeed(`12345:${question.id}:options`),
    );
    const second = deterministicShuffle(
      question.options.map((option) => option.id),
      hashSeed(`12345:${question.id}:options`),
    );

    if (JSON.stringify(first) !== JSON.stringify(second)) {
      failures.push(`${question.id} option shuffle is not deterministic`);
    }
    if (new Set(first).size !== 4) {
      failures.push(`${question.id} shuffle lost an option`);
    }
  }

  const requiredFiles = [
    "app/tests/page.tsx",
    "app/tests/sesion/page.tsx",
    "app/tests/resultados/page.tsx",
    "components/quiz/quiz-setup.tsx",
    "components/quiz/quiz-session.tsx",
    "components/quiz/quiz-question-step.tsx",
    "components/quiz/quiz-results.tsx",
    "components/quiz/quiz-rich-text.tsx",
    "lib/content/quiz-content.ts",
    "lib/quiz/engine.ts",
    "lib/storage/quiz-history.ts",
    "types/quiz.ts",
    "schemas/quiz-history.schema.json",
  ];

  for (const file of requiredFiles) {
    try {
      await access(path.join(root, file));
    } catch {
      failures.push(`Missing ${file}`);
    }
  }

  const types = await readFile(path.join(root, "types/quiz.ts"), "utf8");
  for (const mode of ["BLOCK", "UNIT", "ERRORS", "ADAPTIVE"]) {
    if (!types.includes(`"${mode}"`)) failures.push(`Missing mode ${mode}`);
  }
  if (!types.includes("[10, 20, 30] as const")) {
    failures.push("Session sizes 10/20/30 are not canonical");
  }

  const setup = await readFile(
    path.join(root, "components/quiz/quiz-setup.tsx"),
    "utf8",
  );
  for (const token of ["sessionId", "seed", "Repasar errores", "Adaptativo V1"]) {
    if (!setup.includes(token)) failures.push(`Setup missing ${token}`);
  }

  const sessionPage = await readFile(
    path.join(root, "app/tests/sesion/page.tsx"),
    "utf8",
  );
  for (const token of ["sid", "seed", "ids", "requestedSize"]) {
    if (!sessionPage.includes(token)) failures.push(`Session route missing ${token}`);
  }

  const history = await readFile(
    path.join(root, "lib/storage/quiz-history.ts"),
    "utf8",
  );
  if (!history.includes("QUIZ_HISTORY_V1")) {
    failures.push("Quiz history schema version missing");
  }
  if (!history.includes("lastCorrect")) {
    failures.push("Quiz history does not preserve error-review state");
  }

  return {
    failures,
    counts: {
      questions: questions.length,
      modes: 4,
      sessionSizes: 3,
      optionShufflesChecked: questions.length,
    },
  };
}
