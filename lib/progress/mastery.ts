import type { MasteryState } from "@/types/progress";

export interface MasteryEvidence {
  score: number;
  interactions: number;
  recentSignificantFailure?: boolean;
}

export function masteryState({ score, interactions, recentSignificantFailure = false }: MasteryEvidence): MasteryState {
  if (interactions === 0) return "NEW";
  if (score >= 85 && interactions >= 6 && !recentSignificantFailure) return "MASTERED";
  if (score >= 70 && interactions >= 4) return "UNDERSTOOD";
  return "LEARNING";
}
