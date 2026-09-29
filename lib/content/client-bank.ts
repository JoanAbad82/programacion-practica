import block2Flashcards01 from "@/content/block-2/flashcards/u01.json";
import block2Flashcards02 from "@/content/block-2/flashcards/u02.json";
import block2Flashcards03 from "@/content/block-2/flashcards/u03.json";
import block2Flashcards04 from "@/content/block-2/flashcards/u04.json";
import block2Flashcards05 from "@/content/block-2/flashcards/u05.json";
import block2Flashcards06 from "@/content/block-2/flashcards/u06.json";
import block2Flashcards07 from "@/content/block-2/flashcards/u07.json";
import block2Flashcards08 from "@/content/block-2/flashcards/u08.json";
import block2Flashcards09 from "@/content/block-2/flashcards/u09.json";
import block2Flashcards10 from "@/content/block-2/flashcards/u10.json";
import block2Flashcards11 from "@/content/block-2/flashcards/u11.json";
import block2Flashcards12 from "@/content/block-2/flashcards/u12.json";
import block2Questions01 from "@/content/block-2/questions/u01.json";
import block2Questions02 from "@/content/block-2/questions/u02.json";
import block2Questions03 from "@/content/block-2/questions/u03.json";
import block2Questions04 from "@/content/block-2/questions/u04.json";
import block2Questions05 from "@/content/block-2/questions/u05.json";
import block2Questions06 from "@/content/block-2/questions/u06.json";
import block2Questions07 from "@/content/block-2/questions/u07.json";
import block2Questions08 from "@/content/block-2/questions/u08.json";
import block2Questions09 from "@/content/block-2/questions/u09.json";
import block2Questions10 from "@/content/block-2/questions/u10.json";
import block2Questions11 from "@/content/block-2/questions/u11.json";
import block2Questions12 from "@/content/block-2/questions/u12.json";
import flashcards01 from "@/content/block-1/flashcards/u01.json";
import flashcards02 from "@/content/block-1/flashcards/u02.json";
import flashcards03 from "@/content/block-1/flashcards/u03.json";
import flashcards04 from "@/content/block-1/flashcards/u04.json";
import flashcards05 from "@/content/block-1/flashcards/u05.json";
import flashcards06 from "@/content/block-1/flashcards/u06.json";
import flashcards07 from "@/content/block-1/flashcards/u07.json";
import flashcards08 from "@/content/block-1/flashcards/u08.json";
import flashcards09 from "@/content/block-1/flashcards/u09.json";
import flashcards10 from "@/content/block-1/flashcards/u10.json";
import flashcards11 from "@/content/block-1/flashcards/u11.json";
import flashcards12 from "@/content/block-1/flashcards/u12.json";
import questions01 from "@/content/block-1/questions/u01.json";
import questions02 from "@/content/block-1/questions/u02.json";
import questions03 from "@/content/block-1/questions/u03.json";
import questions04 from "@/content/block-1/questions/u04.json";
import questions05 from "@/content/block-1/questions/u05.json";
import questions06 from "@/content/block-1/questions/u06.json";
import questions07 from "@/content/block-1/questions/u07.json";
import questions08 from "@/content/block-1/questions/u08.json";
import questions09 from "@/content/block-1/questions/u09.json";
import questions10 from "@/content/block-1/questions/u10.json";
import questions11 from "@/content/block-1/questions/u11.json";
import questions12 from "@/content/block-1/questions/u12.json";
import type { Flashcard } from "@/types/flashcard";
import type { Question } from "@/types/question";
import type { BlockId } from "@/types/block";
import { activeFlashcards, activeQuestions } from "./bank";

/**
 * Browser-safe copy of the canonical block banks.
 *
 * Static export removes request-time rendering, so session and result routes
 * that rebuild themselves from query parameters resolve their content here
 * instead of through `node:fs`. The JSON is the same canonical source used by
 * the build-time loaders and keeps the ACTIVE filter and id order.
 */
export const block1Questions = activeQuestions([
  questions01 as Question[],
  questions02 as Question[],
  questions03 as Question[],
  questions04 as Question[],
  questions05 as Question[],
  questions06 as Question[],
  questions07 as Question[],
  questions08 as Question[],
  questions09 as Question[],
  questions10 as Question[],
  questions11 as Question[],
  questions12 as Question[],
]);

export const block1Flashcards = activeFlashcards([
  flashcards01 as Flashcard[],
  flashcards02 as Flashcard[],
  flashcards03 as Flashcard[],
  flashcards04 as Flashcard[],
  flashcards05 as Flashcard[],
  flashcards06 as Flashcard[],
  flashcards07 as Flashcard[],
  flashcards08 as Flashcard[],
  flashcards09 as Flashcard[],
  flashcards10 as Flashcard[],
  flashcards11 as Flashcard[],
  flashcards12 as Flashcard[],
]);

export const block2Questions = activeQuestions([
  block2Questions01 as Question[],
  block2Questions02 as Question[],
  block2Questions03 as Question[],
  block2Questions04 as Question[],
  block2Questions05 as Question[],
  block2Questions06 as Question[],
  block2Questions07 as Question[],
  block2Questions08 as Question[],
  block2Questions09 as Question[],
  block2Questions10 as Question[],
  block2Questions11 as Question[],
  block2Questions12 as Question[],
]);

export const block2Flashcards = activeFlashcards([
  block2Flashcards01 as Flashcard[],
  block2Flashcards02 as Flashcard[],
  block2Flashcards03 as Flashcard[],
  block2Flashcards04 as Flashcard[],
  block2Flashcards05 as Flashcard[],
  block2Flashcards06 as Flashcard[],
  block2Flashcards07 as Flashcard[],
  block2Flashcards08 as Flashcard[],
  block2Flashcards09 as Flashcard[],
  block2Flashcards10 as Flashcard[],
  block2Flashcards11 as Flashcard[],
  block2Flashcards12 as Flashcard[],
]);

export function questionsForBlock(blockId: BlockId): Question[] {
  return blockId === "B2" ? block2Questions : block1Questions;
}

export function flashcardsForBlock(blockId: BlockId): Flashcard[] {
  return blockId === "B2" ? block2Flashcards : block1Flashcards;
}
