import type { Language } from "./content";
import type { Question, QuestionType } from "./question";

export const QUIZ_SESSION_SIZES = [10, 20, 30] as const;
export type QuizSessionSize = (typeof QUIZ_SESSION_SIZES)[number];

export type QuizMode = "BLOCK" | "UNIT" | "ERRORS" | "ADAPTIVE";
export type QuizLanguageFilter = "ALL" | Language;
export type QuizDifficultyFilter = "ALL" | 1 | 2 | 3;
export type QuizTypeFilter = "ALL" | QuestionType;

export interface QuizFilters {
  language: QuizLanguageFilter;
  difficulty: QuizDifficultyFilter;
  questionType: QuizTypeFilter;
}

export interface QuizQuestionMeta {
  id: string;
  unitId: string;
  primaryConceptId: string;
  type: QuestionType;
  difficulty: 1 | 2 | 3;
  language: Language;
}

export interface QuizSessionConfig {
  sessionId: string;
  seed: number;
  mode: QuizMode;
  unitId: string | null;
  requestedSize: QuizSessionSize;
  questionIds: string[];
  filters: QuizFilters;
}

export interface QuizAttempt {
  questionId: string;
  unitId: string;
  conceptId: string;
  difficulty: 1 | 2 | 3;
  selectedOptionId: string;
  correctOptionId: string;
  correct: boolean;
  answeredAt: string;
}

export interface StoredQuizSession extends QuizSessionConfig {
  startedAt: string;
  completedAt: string | null;
  attempts: QuizAttempt[];
}

export interface QuizQuestionStats {
  questionId: string;
  attempts: number;
  correct: number;
  incorrect: number;
  lastCorrect: boolean | null;
  lastAttemptAt: string | null;
}

export interface QuizHistorySnapshot {
  schemaVersion: "QUIZ_HISTORY_V1";
  sessions: Record<string, StoredQuizSession>;
  questionStats: Record<string, QuizQuestionStats>;
}

export interface QuizSessionPayload {
  config: QuizSessionConfig;
  questions: Question[];
}
