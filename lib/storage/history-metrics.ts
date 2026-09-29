import { blockIdFromContentId, type BlockId } from "@/types/block";
import type { QuizHistorySnapshot } from "@/types/quiz";
import type { FlashcardHistorySnapshot } from "@/types/flashcard-session";

/**
 * Block-scoped history metrics shared by the quiz/flashcard setup panels.
 *
 * Sessions are normalized on read, so `session.blockId` already defaults or
 * infers `B1` for legacy entries. Question/card stats are keyed by block-unique
 * ids (`B1-Q0001`, `B2-FC0003`), so their block is derived from the id; ids
 * without a recognizable prefix fall back to `B1`, mirroring the storage
 * parsers and never dropping or mis-attributing legacy history.
 */
function sessionBlockId(session: { blockId?: BlockId }): BlockId {
  return session.blockId ?? "B1";
}

function contentBlockId(id: string): BlockId {
  return blockIdFromContentId(id) ?? "B1";
}

export interface QuizHistoryMetrics {
  completedSessions: number;
  totalAttempts: number;
  errorCount: number;
}

export function quizHistoryMetrics(
  history: QuizHistorySnapshot,
  blockId: BlockId,
): QuizHistoryMetrics {
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

export interface FlashcardHistoryMetrics {
  completedSessions: number;
  totalSeen: number;
  needsReview: number;
}

export function flashcardHistoryMetrics(
  history: FlashcardHistorySnapshot,
  blockId: BlockId,
): FlashcardHistoryMetrics {
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
