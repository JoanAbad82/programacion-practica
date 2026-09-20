import type { ProgressModel } from "@/types/progress";

/**
 * Abstraction reserved for a future remote persistence layer.
 * In V1 the mastery model is derived locally from study, quiz and flashcard
 * histories, so no duplicate progress database is written.
 */
export interface ProgressRepository {
  getProgress(): Promise<ProgressModel>;
  resetProgress(): Promise<void>;
}
