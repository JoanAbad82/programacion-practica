"use client";

import { useMemo } from "react";
import { buildProgressModel } from "@/lib/progress/mastery";
import { useFlashcardHistory } from "@/lib/storage/flashcard-history";
import { useQuizHistory } from "@/lib/storage/quiz-history";
import { useStudyProgress } from "@/lib/storage/unit-study-progress";
import type { BlockId } from "@/types/block";
import type { Concept } from "@/types/content";
import type { StudyUnitMeta } from "@/types/study";

export function useUnifiedProgress({
  concepts,
  units,
  blockId = "B1",
}: {
  concepts: Concept[];
  units: StudyUnitMeta[];
  blockId?: BlockId;
}) {
  const quizHistory = useQuizHistory();
  const flashcardHistory = useFlashcardHistory();
  const studyProgress = useStudyProgress();

  return useMemo(
    () => {
      const model = buildProgressModel({
        concepts,
        units,
        quizHistory,
        flashcardHistory,
        studyProgress,
      });

      // `block` stays the backwards-compatible "selected block" summary while
      // `blocks` exposes every block computed from the same evidence.
      return { ...model, block: model.blocks[blockId] };
    },
    [concepts, units, blockId, quizHistory, flashcardHistory, studyProgress],
  );
}
