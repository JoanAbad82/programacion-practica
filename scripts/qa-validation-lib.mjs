import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function walkCode(relativeRoot) {
  const start = path.join(root, relativeRoot);
  const output = [];

  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      const full = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(full);
      } else if (/\.(?:ts|tsx|js|mjs)$/i.test(entry.name)) {
        output.push(full);
      }
    }
  }

  await visit(start);
  return output;
}

export const persistenceContracts = [
  {
    module: "lib/storage/unit-study-progress.ts",
    key: "pp-study-progress-v1",
    version: "STUDY_PROGRESS_V1",
  },
  {
    module: "lib/storage/quiz-history.ts",
    key: "pp-quiz-history-v1",
    version: "QUIZ_HISTORY_V1",
  },
  {
    module: "lib/storage/flashcard-history.ts",
    key: "pp-flashcard-history-v1",
    version: "FLASHCARD_HISTORY_V1",
  },
];

export function simulatePersistenceRoundTrips() {
  const quiz = {
    schemaVersion: "QUIZ_HISTORY_V1",
    sessions: {
      "qa-quiz": {
        sessionId: "qa-quiz",
        seed: 12345,
        mode: "BLOCK",
        unitId: null,
        requestedSize: 10,
        questionIds: ["B1-Q0001", "B1-Q0002"],
        filters: { language: "ALL", difficulty: "ALL", questionType: "ALL" },
        startedAt: "2026-09-20T20:00:00.000Z",
        completedAt: null,
        attempts: [
          {
            questionId: "B1-Q0001",
            unitId: "U01",
            conceptId: "B1-U01-PROGRAMA",
            difficulty: 1,
            selectedOptionId: "opt_1",
            correctOptionId: "opt_1",
            correct: true,
            answeredAt: "2026-09-20T20:01:00.000Z",
          },
        ],
      },
    },
    questionStats: {},
  };

  const flashcards = {
    schemaVersion: "FLASHCARD_HISTORY_V1",
    sessions: {
      "qa-cards": {
        sessionId: "qa-cards",
        seed: 67890,
        mode: "MIXED",
        requestedSize: 10,
        cardIds: ["B1-FC0001", "B1-FC0002"],
        filters: { unitId: null, language: "ALL", cardType: "ALL" },
        allowReverse: true,
        startedAt: "2026-09-20T20:00:00.000Z",
        completedAt: null,
        queue: [
          { cardId: "B1-FC0002", direction: "FRONT_TO_BACK", exposure: 1 },
        ],
        attempts: [
          {
            cardId: "B1-FC0001",
            conceptId: "B1-U01-PROGRAMA",
            rating: "KNOW",
            direction: "FRONT_TO_BACK",
            exposure: 1,
            ratedAt: "2026-09-20T20:01:00.000Z",
          },
        ],
      },
    },
    cardStats: {},
  };

  const quizRoundTrip = JSON.parse(JSON.stringify(quiz));
  const flashcardRoundTrip = JSON.parse(JSON.stringify(flashcards));

  return {
    quiz:
      quizRoundTrip.sessions["qa-quiz"].attempts.length === 1 &&
      quizRoundTrip.sessions["qa-quiz"].completedAt === null,
    flashcards:
      flashcardRoundTrip.sessions["qa-cards"].queue[0].cardId === "B1-FC0002" &&
      flashcardRoundTrip.sessions["qa-cards"].attempts.length === 1 &&
      flashcardRoundTrip.sessions["qa-cards"].completedAt === null,
  };
}

export async function validateReleaseCandidate() {
  const failures = [];

  const requiredRoutes = [
    "app/page.tsx",
    "app/estudiar/page.tsx",
    "app/estudiar/b1/page.tsx",
    "app/estudiar/b1/[unitId]/page.tsx",
    "app/tests/page.tsx",
    "app/tests/sesion/page.tsx",
    "app/tests/resultados/page.tsx",
    "app/tarjetas/page.tsx",
    "app/tarjetas/sesion/page.tsx",
    "app/tarjetas/resultados/page.tsx",
    "app/progreso/page.tsx",
    "app/ajustes/page.tsx",
    "app/not-found.tsx",
    "app/error.tsx",
  ];

  for (const route of requiredRoutes) {
    if (!(await exists(route))) failures.push(`Missing route source: ${route}`);
  }

  const keys = new Set();
  for (const contract of persistenceContracts) {
    const source = await read(contract.module);

    if (!source.includes(contract.key)) {
      failures.push(`${contract.module} missing storage key ${contract.key}`);
    }
    if (!source.includes(contract.version)) {
      failures.push(`${contract.module} missing schema ${contract.version}`);
    }
    if (keys.has(contract.key)) {
      failures.push(`Duplicate persistence namespace ${contract.key}`);
    }
    keys.add(contract.key);
  }

  const quizSession = await read("components/quiz/quiz-session.tsx");
  for (const token of [
    "storedSession?.attempts.length ?? 0",
    "questions[completedAttempts]",
    "storedSession?.completedAt",
  ]) {
    if (!quizSession.includes(token)) {
      failures.push(`Quiz resume contract missing: ${token}`);
    }
  }

  const flashSession = await read("components/flashcards/flashcard-session.tsx");
  for (const token of [
    "stored?.queue[0]",
    "stored.attempts",
    "stored?.completedAt",
  ]) {
    if (!flashSession.includes(token)) {
      failures.push(`Flashcard resume contract missing: ${token}`);
    }
  }

  const reset = await read("components/settings/local-data-controls.tsx");
  for (const contract of persistenceContracts) {
    if (!reset.includes(contract.key)) {
      failures.push(`Learning reset missing ${contract.key}`);
    }
  }
  if (reset.includes('removeItem("pp-theme")') || reset.includes("removeItem('pp-theme')")) {
    failures.push("Learning reset must preserve pp-theme");
  }

  const testsSession = await read("app/tests/sesion/page.tsx");
  const testsResults = await read("app/tests/resultados/page.tsx");
  const cardsSession = await read("app/tarjetas/sesion/page.tsx");
  const cardsResults = await read("app/tarjetas/resultados/page.tsx");
  const notFound = await read("app/not-found.tsx");
  const error = await read("app/error.tsx");

  if (!testsSession.includes("Sesión no válida")) failures.push("Quiz invalid-session state missing");
  if (!testsResults.includes("Falta el identificador de sesión")) failures.push("Quiz missing-session result state missing");
  if (!cardsSession.includes("Sesión no válida")) failures.push("Flashcard invalid-session state missing");
  if (!cardsResults.includes("Falta el identificador de sesión")) failures.push("Flashcard missing-session result state missing");
  if (!notFound.includes("404")) failures.push("404 state missing");
  if (!error.includes("reset")) failures.push("Recoverable error reset action missing");

  const header = await read("components/layout/site-header.tsx");
  for (const href of ["/estudiar", "/tests", "/tarjetas", "/progreso", "/ajustes"]) {
    if (!header.includes(`"${href}"`)) failures.push(`Primary navigation missing ${href}`);
  }
  if (!header.includes('href="/"')) failures.push("Home navigation missing");

  const acceptance = JSON.parse(await read("release/RC1_ACCEPTANCE.json"));
  const packageJson = JSON.parse(await read("package.json"));

  if (packageJson.version !== "0.1.0-rc.1") {
    failures.push(`Expected package version 0.1.0-rc.1, got ${packageJson.version}`);
  }
  if (acceptance.version !== "0.1.0-rc.1") failures.push("RC1 acceptance version mismatch");
  if (acceptance.base_head !== "76325e27ad066a47e6415135e87c9af00f6ae377") {
    failures.push("RC1 acceptance base HEAD mismatch");
  }
  if (acceptance.qa?.clean_builds !== 2) failures.push("RC1 must require two clean builds");
  if (acceptance.qa?.http_routes !== 16) failures.push("RC1 must require 16 HTTP route checks");
  if (acceptance.runtime_ai !== false) failures.push("RC1 runtime_ai must be false");

  const runtimeAiPattern = /\b(?:openai|anthropic|deepseek|tinyfish|gemini)\b/i;
  for (const directory of ["app", "components", "lib"]) {
    for (const file of await walkCode(directory)) {
      const source = await readFile(file, "utf8");
      if (runtimeAiPattern.test(source)) {
        failures.push(`Runtime AI provider reference found in ${path.relative(root, file)}`);
      }
    }
  }

  const roundTrips = simulatePersistenceRoundTrips();
  if (!roundTrips.quiz) failures.push("Quiz persistence round-trip failed");
  if (!roundTrips.flashcards) failures.push("Flashcard persistence round-trip failed");

  for (const script of [
    "scripts/qa-build-surface.mjs",
    "scripts/qa-http-smoke.mjs",
    "scripts/qa-source-inventory.mjs",
  ]) {
    if (!(await exists(script))) failures.push(`Missing RC tooling ${script}`);
  }

  return {
    failures,
    facts: {
      persistenceNamespaces: keys.size,
      routes: requiredRoutes.length,
      runtimeAi: false,
      releaseVersion: packageJson.version,
      quizRoundTrip: roundTrips.quiz,
      flashcardRoundTrip: roundTrips.flashcards,
    },
  };
}
