import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  persistenceContracts,
  simulatePersistenceRoundTrips,
  validateReleaseCandidate,
} from "../scripts/qa-validation-lib.mjs";

const root = process.cwd();
const read = (relativePath) =>
  readFile(path.join(root, relativePath), "utf8");

test("Phase 8 QA validator passes", async () => {
  const result = await validateReleaseCandidate();
  assert.deepEqual(result.failures, []);
});

test("the three learning persistence namespaces are unique and versioned", () => {
  assert.equal(persistenceContracts.length, 3);
  assert.equal(
    new Set(persistenceContracts.map((contract) => contract.key)).size,
    3,
  );
  for (const contract of persistenceContracts) {
    assert.match(contract.key, /^pp-/);
    assert.match(contract.version, /_V1$/);
  }
});

test("quiz persistence survives serialization while remaining resumable", () => {
  assert.equal(simulatePersistenceRoundTrips().quiz, true);
});

test("flashcard persistence survives serialization with its queue intact", () => {
  assert.equal(simulatePersistenceRoundTrips().flashcards, true);
});

test("quiz session resumes from the number of persisted attempts", async () => {
  const source = await read("components/quiz/quiz-session.tsx");
  assert.match(source, /storedSession\?\.attempts\.length \?\? 0/);
  assert.match(source, /questions\[completedAttempts\]/);
});

test("flashcard session resumes from the persisted queue", async () => {
  const source = await read("components/flashcards/flashcard-session.tsx");
  assert.match(source, /stored\?\.queue\[0\]/);
  assert.match(source, /stored\.attempts/);
});

test("reset clears learning histories but deliberately preserves theme", async () => {
  const source = await read("components/settings/local-data-controls.tsx");
  for (const contract of persistenceContracts) {
    assert.match(source, new RegExp(contract.key.replaceAll("-", "\\-")));
  }
  assert.doesNotMatch(source, /removeItem\(["']pp-theme["']\)/);
});

test("invalid sessions, missing results, 404 and recoverable error states exist", async () => {
  assert.match(await read("app/tests/sesion/page.tsx"), /Sesión no válida/);
  assert.match(await read("app/tarjetas/sesion/page.tsx"), /Sesión no válida/);
  assert.match(await read("app/tests/resultados/page.tsx"), /Falta el identificador de sesión/);
  assert.match(await read("app/tarjetas/resultados/page.tsx"), /Falta el identificador de sesión/);
  assert.match(await read("app/not-found.tsx"), /404/);
  assert.match(await read("app/error.tsx"), /\breset\b/);
});

test("runtime application code contains no configured AI provider", async () => {
  const result = await validateReleaseCandidate();
  assert.equal(result.facts.runtimeAi, false);
  assert.equal(
    result.failures.some((failure) => failure.includes("Runtime AI provider")),
    false,
  );
});

test("release contract requires a static export, two clean builds and a 16-route HTTP smoke", async () => {
  const acceptance = JSON.parse(await read("release/RC1_ACCEPTANCE.json"));
  const packageJson = JSON.parse(await read("package.json"));
  assert.match(packageJson.version, /^\d+\.\d+\.\d+$/);
  assert.equal(acceptance.version, packageJson.version);
  assert.equal(acceptance.target, "cloudflare-pages-static");
  assert.equal(acceptance.qa.clean_builds, 2);
  assert.equal(acceptance.qa.http_routes, 16);
  assert.equal(acceptance.qa.regression_tests_min, 54);
});
