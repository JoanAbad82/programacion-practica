import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Question } from "@/types/question";
import type { QuizQuestionMeta } from "@/types/quiz";

const questionRoot = path.join(
  process.cwd(),
  "content",
  "block-1",
  "questions",
);

export async function getBlock1Questions(): Promise<Question[]> {
  const files = Array.from(
    { length: 12 },
    (_, index) => `u${String(index + 1).padStart(2, "0")}.json`,
  );

  const groups = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(questionRoot, file), "utf8");
      return JSON.parse(raw) as Question[];
    }),
  );

  return groups
    .flat()
    .filter((question) => question.status === "ACTIVE")
    .sort((a, b) => a.id.localeCompare(b.id));
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
