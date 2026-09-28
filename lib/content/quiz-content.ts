import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Question } from "@/types/question";
import type { QuizQuestionMeta } from "@/types/quiz";
import type { BlockId } from "@/types/block";
import { activeQuestions, blockUnitFiles } from "./bank";
import { blockContentRoot } from "./blocks";

export async function getBlockQuestions(blockId: BlockId): Promise<Question[]> {
  const questionRoot = path.join(blockContentRoot(blockId), "questions");
  const groups = await Promise.all(
    blockUnitFiles().map(async (file) => {
      const raw = await readFile(path.join(questionRoot, file), "utf8");
      return JSON.parse(raw) as Question[];
    }),
  );

  return activeQuestions(groups);
}

export async function getBlockQuestionMetas(
  blockId: BlockId,
): Promise<QuizQuestionMeta[]> {
  return (await getBlockQuestions(blockId)).map((question) => ({
    id: question.id,
    unitId: question.unitId,
    primaryConceptId: question.primaryConceptId,
    type: question.type,
    difficulty: question.difficulty,
    language: question.language,
  }));
}

/* Backwards-compatible Bloque 1 wrappers. */

export function getBlock1Questions(): Promise<Question[]> {
  return getBlockQuestions("B1");
}

export function getBlock1QuestionMetas(): Promise<QuizQuestionMeta[]> {
  return getBlockQuestionMetas("B1");
}
