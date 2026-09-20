import type { Priority } from "./content";
import type { StudyUnitStatus } from "./study";

export type MasteryState = "NEW" | "LEARNING" | "UNDERSTOOD" | "MASTERED";
export type FlashcardRating = "MISS" | "DOUBT" | "KNOW";
export type MasteryEvidenceKind = "STUDY" | "QUIZ" | "FLASHCARD";

export interface MasteryEvidence {
  id: string;
  kind: MasteryEvidenceKind;
  conceptId: string;
  unitId: string;
  occurredAt: string;
  value: number;
  weight: number;
  significantFailure: boolean;
  detail: string;
}

export interface MasteryStateCounts {
  new: number;
  learning: number;
  understood: number;
  mastered: number;
}

export interface ConceptProgress {
  conceptId: string;
  unitId: string;
  name: string;
  priority: Priority;
  questionAttempts: number;
  questionCorrect: number;
  flashcardSeen: number;
  flashcardKnow: number;
  flashcardDoubt: number;
  flashcardMiss: number;
  studyStatus: StudyUnitStatus;
  interactions: number;
  objectiveInteractions: number;
  evidenceWindowCount: number;
  lastInteractionAt: string | null;
  recentSignificantFailure: boolean;
  masteryScore: number;
  masteryState: MasteryState;
}

export interface UnitProgressSummary {
  unitId: string;
  title: string;
  studyStatus: StudyUnitStatus;
  conceptCount: number;
  masteryScore: number;
  coveragePercent: number;
  stateCounts: MasteryStateCounts;
}

export interface ProgressActivitySummary {
  studiedUnits: number;
  inProgressUnits: number;
  quizAttempts: number;
  quizCorrect: number;
  quizAccuracy: number;
  flashcardRatings: number;
  flashcardKnow: number;
  flashcardDoubt: number;
  flashcardMiss: number;
}

export interface BlockProgressSummary {
  blockId: "B1";
  conceptCount: number;
  masteryScore: number;
  coveragePercent: number;
  stateCounts: MasteryStateCounts;
  activity: ProgressActivitySummary;
}

export interface ProgressModel {
  schemaVersion: "PROGRESS_MODEL_V1";
  generatedAt: string | null;
  concepts: Record<string, ConceptProgress>;
  units: Record<string, UnitProgressSummary>;
  block: BlockProgressSummary;
}
