import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { loadBlock } from "../scripts/content-validation-lib.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), "utf8");
}

test("B1 and B2 question/card ids can never collide", async () => {
  const [b1, b2] = await Promise.all([loadBlock("B1", root), loadBlock("B2", root)]);
  const b1QuestionIds = new Set(b1.questions.map((question) => question.id));
  const b2QuestionIds = new Set(b2.questions.map((question) => question.id));
  assert.equal([...b2QuestionIds].some((id) => b1QuestionIds.has(id)), false);

  const b1CardIds = new Set(b1.flashcards.map((card) => card.id));
  const b2CardIds = new Set(b2.flashcards.map((card) => card.id));
  assert.equal([...b2CardIds].some((id) => b1CardIds.has(id)), false);

  assert.equal(b2.questions.every((question) => question.id.startsWith("B2-")), true);
  assert.equal(b2.flashcards.every((card) => card.id.startsWith("B2-")), true);
});

test("quiz selection seed includes the block, keeping both banks disjoint", async () => {
  const engine = await read("lib/quiz/engine.ts");
  assert.match(engine, /blockId\?: BlockId/);
  assert.match(engine, /hashSeed\(`\$\{seed\}:\$\{mode\}:\$\{blockId\}/);

  const setup = await read("components/quiz/quiz-setup.tsx");
  assert.match(setup, /selectQuestionIds\(\{/);
  assert.match(setup, /blockId,/);
  assert.match(setup, /block: blockQueryValue\(blockId\)/);
});

test("flashcard selection seed includes the block", async () => {
  const engine = await read("lib/flashcards/engine.ts");
  assert.match(engine, /blockId\?: BlockId/);
  assert.match(engine, /\$\{seed\}:flashcards:mixed:\$\{blockId\}/);

  const setup = await read("components/flashcards/flashcard-setup.tsx");
  assert.match(setup, /selectFlashcardIds\(\{/);
  assert.match(setup, /block: blockQueryValue\(blockId\)/);
});

test("quiz and flashcard session links carry the block forward", async () => {
  const quizSession = await read("components/quiz/quiz-session.tsx");
  assert.match(quizSession, /resultsHref/);
  assert.match(quizSession, /block=\$\{config\.blockId \?\? "B1"\}/);

  const cardSession = await read("components/flashcards/flashcard-session.tsx");
  assert.match(cardSession, /resultsHref/);
  assert.match(cardSession, /block=\$\{config\.blockId \?\? "B1"\}/);

  const quizResults = await read("components/quiz/quiz-results.tsx");
  assert.match(quizResults, /mode=errors&block=\$\{blockId\}/);

  const cardResults = await read("components/flashcards/flashcard-results.tsx");
  assert.match(cardResults, /mode=adaptive&block=\$\{blockId\}/);
});

test("results routes default missing block params to B1 for backwards compatibility", async () => {
  const quizResults = await read("app/tests/resultados/page.tsx");
  assert.match(quizResults, /parseBlockParam\(searchParams\.get\("block"\), "B1"\)/);
  assert.match(quizResults, /questionsForBlock\(blockId\)/);
});
