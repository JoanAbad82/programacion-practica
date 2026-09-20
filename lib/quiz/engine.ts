import type { QuestionOption } from "@/types/question";
import type {
  QuizFilters,
  QuizHistorySnapshot,
  QuizMode,
  QuizQuestionMeta,
} from "@/types/quiz";

export function hashSeed(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function deterministicShuffle<T>(
  values: readonly T[],
  seed: number,
): T[] {
  const output = [...values];
  const random = createRandom(seed);

  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }

  return output;
}

export function shuffleQuestionOptions(
  options: readonly QuestionOption[],
  seed: number,
  questionId: string,
): QuestionOption[] {
  return deterministicShuffle(
    options,
    hashSeed(`${seed}:${questionId}:options`),
  );
}

export function matchesQuizFilters(
  question: QuizQuestionMeta,
  filters: QuizFilters,
): boolean {
  const languageMatches =
    filters.language === "ALL" || question.language === filters.language;
  const difficultyMatches =
    filters.difficulty === "ALL" || question.difficulty === filters.difficulty;
  const typeMatches =
    filters.questionType === "ALL" || question.type === filters.questionType;

  return languageMatches && difficultyMatches && typeMatches;
}

function adaptiveScore(
  question: QuizQuestionMeta,
  history: QuizHistorySnapshot,
  seed: number,
): number {
  const stats = history.questionStats[question.id];

  if (!stats) {
    return 20 + question.difficulty * 2 +
      (hashSeed(`${seed}:${question.id}`) % 1000) / 10000;
  }

  const errorRate = stats.attempts > 0 ? stats.incorrect / stats.attempts : 0;
  const recentPenalty = stats.lastCorrect === false ? 100 : 0;
  const confidencePenalty = errorRate * 50;
  const challenge = question.difficulty * 2;
  const tieBreak = (hashSeed(`${seed}:${question.id}`) % 1000) / 10000;

  return recentPenalty + confidencePenalty + challenge + tieBreak;
}

export function getErrorQuestionIds(
  history: QuizHistorySnapshot,
): string[] {
  return Object.values(history.questionStats)
    .filter((stats) => stats.lastCorrect === false)
    .sort((a, b) => {
      const aTime = a.lastAttemptAt ?? "";
      const bTime = b.lastAttemptAt ?? "";
      return bTime.localeCompare(aTime);
    })
    .map((stats) => stats.questionId);
}

export function buildQuestionPool({
  questions,
  mode,
  unitId,
  filters,
  history,
}: {
  questions: QuizQuestionMeta[];
  mode: QuizMode;
  unitId: string | null;
  filters: QuizFilters;
  history: QuizHistorySnapshot;
}): QuizQuestionMeta[] {
  let pool = questions.filter((question) =>
    matchesQuizFilters(question, filters),
  );

  if (mode === "UNIT") {
    pool = unitId
      ? pool.filter((question) => question.unitId === unitId)
      : [];
  }

  if (mode === "ERRORS") {
    const errorIds = new Set(getErrorQuestionIds(history));
    pool = pool.filter((question) => errorIds.has(question.id));
  }

  return pool;
}

export function selectQuestionIds({
  questions,
  mode,
  unitId,
  filters,
  history,
  size,
  seed,
}: {
  questions: QuizQuestionMeta[];
  mode: QuizMode;
  unitId: string | null;
  filters: QuizFilters;
  history: QuizHistorySnapshot;
  size: number;
  seed: number;
}): string[] {
  const pool = buildQuestionPool({
    questions,
    mode,
    unitId,
    filters,
    history,
  });

  if (mode === "ADAPTIVE") {
    return [...pool]
      .sort(
        (a, b) =>
          adaptiveScore(b, history, seed) -
          adaptiveScore(a, history, seed),
      )
      .slice(0, size)
      .map((question) => question.id);
  }

  return deterministicShuffle(
    pool,
    hashSeed(`${seed}:${mode}:${unitId ?? "B1"}:questions`),
  )
    .slice(0, size)
    .map((question) => question.id);
}
