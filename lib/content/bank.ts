import type { Flashcard } from "@/types/flashcard";
import type { Question } from "@/types/question";

/**
 * Content-bank helpers shared by the build-time loaders (`node:fs`) and the
 * browser-safe bank, so both surfaces apply the same ACTIVE filter and order.
 */
export const BLOCK_UNIT_FILES = Array.from(
  { length: 12 },
  (_, index) => `u${String(index + 1).padStart(2, "0")}.json`,
);

/** Backwards-compatible alias for the original Bloque 1 file list. */
export const BLOCK1_UNIT_FILES = BLOCK_UNIT_FILES;

export function blockUnitFiles(): string[] {
  return [...BLOCK_UNIT_FILES];
}

export function activeQuestions(groups: Question[][]): Question[] {
  return groups
    .flat()
    .filter((question) => question.status === "ACTIVE")
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function activeFlashcards(groups: Flashcard[][]): Flashcard[] {
  return groups
    .flat()
    .filter((card) => card.status === "ACTIVE")
    .sort((a, b) => a.id.localeCompare(b.id));
}
