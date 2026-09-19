export type MasteryState = "NEW" | "LEARNING" | "UNDERSTOOD" | "MASTERED";
export type FlashcardRating = "MISS" | "DOUBT" | "KNOW";
export interface ConceptProgress {
  conceptId: string;
  questionAttempts: number;
  questionCorrect: number;
  flashcardSeen: number;
  flashcardKnow: number;
  flashcardDoubt: number;
  flashcardMiss: number;
  lastInteractionAt: string | null;
  masteryScore: number;
  masteryState: MasteryState;
}
