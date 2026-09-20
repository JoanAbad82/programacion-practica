import type { Language } from "./content";
import type { FlashcardType } from "./flashcard";

export const FLASHCARD_SESSION_SIZES = [10, 20, 30] as const;
export type FlashcardSessionSize = (typeof FLASHCARD_SESSION_SIZES)[number];

export type FlashcardMode = "MIXED" | "ADAPTIVE";
export type FlashcardRating = "MISS" | "DOUBT" | "KNOW";
export type FlashcardDirection = "FRONT_TO_BACK" | "BACK_TO_FRONT";
export type FlashcardLanguageFilter = "ALL" | Language;
export type FlashcardTypeFilter = "ALL" | FlashcardType;

export interface FlashcardFilters {
  unitId: string | null;
  language: FlashcardLanguageFilter;
  cardType: FlashcardTypeFilter;
}

export interface FlashcardMeta {
  id: string;
  unitId: string;
  primaryConceptId: string;
  type: FlashcardType;
  language: Language;
  reversible: boolean;
}

export interface FlashcardQueueItem {
  cardId: string;
  direction: FlashcardDirection;
  exposure: number;
}

export interface FlashcardSessionConfig {
  sessionId: string;
  seed: number;
  mode: FlashcardMode;
  requestedSize: FlashcardSessionSize;
  cardIds: string[];
  filters: FlashcardFilters;
  allowReverse: boolean;
}

export interface FlashcardAttempt {
  cardId: string;
  conceptId: string;
  rating: FlashcardRating;
  direction: FlashcardDirection;
  exposure: number;
  ratedAt: string;
}

export interface StoredFlashcardSession extends FlashcardSessionConfig {
  startedAt: string;
  completedAt: string | null;
  queue: FlashcardQueueItem[];
  attempts: FlashcardAttempt[];
}

export interface FlashcardStats {
  cardId: string;
  seen: number;
  miss: number;
  doubt: number;
  know: number;
  lastRating: FlashcardRating | null;
  lastSeenAt: string | null;
}

export interface FlashcardHistorySnapshot {
  schemaVersion: "FLASHCARD_HISTORY_V1";
  sessions: Record<string, StoredFlashcardSession>;
  cardStats: Record<string, FlashcardStats>;
}
