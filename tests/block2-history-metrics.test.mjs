import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), "utf8");
}

// Mirror of the runtime scoping in `lib/storage/history-metrics.ts`, pinned as
// data so a refactor cannot silently fall back to cross-block aggregation.
const blockIdFromContentId = (id) => {
  const match = /^(B1|B2)[-_]/i.exec(String(id ?? "").trim());
  return match ? match[1].toUpperCase() : null;
};
const sessionBlockId = (session) => session.blockId ?? "B1";
const contentBlockId = (id) => blockIdFromContentId(id) ?? "B1";

function quizHistoryMetrics(history, blockId) {
  let completedSessions = 0;
  for (const session of Object.values(history.sessions)) {
    if (sessionBlockId(session) === blockId && session.completedAt !== null) {
      completedSessions += 1;
    }
  }
  let totalAttempts = 0;
  let errorCount = 0;
  for (const stats of Object.values(history.questionStats)) {
    if (contentBlockId(stats.questionId) !== blockId) continue;
    totalAttempts += stats.attempts;
    if (stats.lastCorrect === false) errorCount += 1;
  }
  return { completedSessions, totalAttempts, errorCount };
}

function flashcardHistoryMetrics(history, blockId) {
  let completedSessions = 0;
  for (const session of Object.values(history.sessions)) {
    if (sessionBlockId(session) === blockId && session.completedAt !== null) {
      completedSessions += 1;
    }
  }
  let totalSeen = 0;
  let needsReview = 0;
  for (const stats of Object.values(history.cardStats)) {
    if (contentBlockId(stats.cardId) !== blockId) continue;
    totalSeen += stats.seen;
    if (stats.lastRating !== "KNOW") needsReview += 1;
  }
  return { completedSessions, totalSeen, needsReview };
}

test("quiz history metrics are scoped to the selected block", () => {
  const history = {
    sessions: {
      b1Done: { blockId: "B1", completedAt: "2026-01-01" },
      b1Open: { blockId: "B1", completedAt: null },
      b2Done: { blockId: "B2", completedAt: "2026-01-02" },
      // Legacy session without a block id must still count as B1.
      legacy: { completedAt: "2026-01-03" },
    },
    questionStats: {
      b1Error: { questionId: "B1-Q0001", attempts: 3, lastCorrect: false },
      b1Correct: { questionId: "B1-Q0002", attempts: 2, lastCorrect: true },
      b2Error: { questionId: "B2-Q0001", attempts: 5, lastCorrect: false },
      b2Correct: { questionId: "B2-Q0002", attempts: 4, lastCorrect: true },
    },
  };

  assert.deepEqual(quizHistoryMetrics(history, "B1"), {
    completedSessions: 2,
    totalAttempts: 5,
    errorCount: 1,
  });
  assert.deepEqual(quizHistoryMetrics(history, "B2"), {
    completedSessions: 1,
    totalAttempts: 9,
    errorCount: 1,
  });
});

test("flashcard history metrics are scoped to the selected block", () => {
  const history = {
    sessions: {
      b1Done: { blockId: "B1", completedAt: "2026-01-01" },
      b2Open: { blockId: "B2", completedAt: null },
      legacy: { completedAt: "2026-01-03" },
    },
    cardStats: {
      b1Know: { cardId: "B1-FC0001", seen: 4, lastRating: "KNOW" },
      b1Doubt: { cardId: "B1-FC0002", seen: 2, lastRating: "DOUBT" },
      b2Miss: { cardId: "B2-FC0001", seen: 6, lastRating: "MISS" },
      b2Know: { cardId: "B2-FC0002", seen: 1, lastRating: "KNOW" },
    },
  };

  assert.deepEqual(flashcardHistoryMetrics(history, "B1"), {
    completedSessions: 2,
    totalSeen: 6,
    needsReview: 1,
  });
  assert.deepEqual(flashcardHistoryMetrics(history, "B2"), {
    completedSessions: 0,
    totalSeen: 7,
    needsReview: 1,
  });
});

test("setup panels derive their metrics from the block-scoped helper", async () => {
  const helper = await read("lib/storage/history-metrics.ts");
  assert.match(helper, /blockIdFromContentId/);
  assert.match(helper, /session\.blockId \?\? "B1"/);
  assert.match(helper, /lastCorrect === false/);
  assert.match(helper, /lastRating !== "KNOW"/);

  const quiz = await read("components/quiz/quiz-setup.tsx");
  assert.match(quiz, /quizHistoryMetrics\(history, blockId\)/);
  assert.doesNotMatch(
    quiz,
    /Object\.values\(history\.questionStats\)\.reduce/,
  );
  assert.doesNotMatch(quiz, /getErrorQuestionIds\(history\)\.length/);

  const cards = await read("components/flashcards/flashcard-setup.tsx");
  assert.match(cards, /flashcardHistoryMetrics\(history, blockId\)/);
  assert.doesNotMatch(cards, /Object\.values\(history\.cardStats\)\.reduce/);
});
