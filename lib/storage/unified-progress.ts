"use client";

import { useMemo } from "react";
import { buildProgressModel } from "@/lib/progress/mastery";
import { useFlashcardHistory } from "@/lib/storage/flashcard-history";
import { useQuizHistory } from "@/lib/storage/quiz-history";
import { useStudyProgress } from "@/lib/storage/unit-study-progress";
import type { Concept } from "@/types/content";
import type { StudyUnitMeta } from "@/types/study";

export function useUnifiedProgress({
  concepts,
  units,
}: {
  concepts: Concept[];
  units: StudyUnitMeta[];
}) {
  const quizHistory = useQuizHistory();
  const flashcardHistory = useFlashcardHistory();
  const studyProgress = useStudyProgress();

  return useMemo(
    () =>
      buildProgressModel({
        concepts,
        units,
        quizHistory,
        flashcardHistory,
        studyProgress,
      }),
    [concepts, units, quizHistory, flashcardHistory, studyProgress],
  );
}
