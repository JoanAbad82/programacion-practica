import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Question } from "@/types/question";
import type { QuizQuestionMeta } from "@/types/quiz";
import { activeQuestions, BLOCK1_UNIT_FILES } from "./bank";

const questionRoot = path.join(
  process.cwd(),
  "content",
  "block-1",
  "questions",
);

export async function getBlock1Questions(): Promise<Question[]> {
  const groups = await Promise.all(
    BLOCK1_UNIT_FILES.map(async (file) => {
      const raw = await readFile(path.join(questionRoot, file), "utf8");
      return JSON.parse(raw) as Question[];
    }),
  );

  return activeQuestions(groups);
}

export async function getBlock1QuestionMetas(): Promise<QuizQuestionMeta[]> {
  return (await getBlock1Questions()).map((question) => ({
    id: question.id,
    unitId: question.unitId,
    primaryConceptId: question.primaryConceptId,
    type: question.type,
    difficulty: question.difficulty,
    language: question.language,
  }));
}
