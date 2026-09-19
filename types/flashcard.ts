import type { Language } from "./content";
export type FlashcardType = "CD" | "CM" | "CR" | "EC" | "PX";
export interface Flashcard {
  id: string;
  blockId: string;
  unitId: string;
  primaryConceptId: string;
  secondaryConceptIds: string[];
  type: FlashcardType;
  language: Language;
  front: string;
  back: string;
  reversible: boolean;
  sourceVersion: string;
  conceptBankVersion: string;
  flashcardBankVersion: string;
  status: "ACTIVE" | "RETIRED";
}
