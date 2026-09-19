import type { ConceptProgress, FlashcardRating } from "@/types/progress";
export interface ProgressRepository {
  getConceptProgress(conceptId: string): Promise<ConceptProgress | null>;
  recordQuestionAttempt(questionId: string, conceptId: string, correct: boolean, difficulty: 1 | 2 | 3): Promise<void>;
  recordFlashcardResult(flashcardId: string, conceptId: string, rating: FlashcardRating): Promise<void>;
  resetProgress(): Promise<void>;
}
