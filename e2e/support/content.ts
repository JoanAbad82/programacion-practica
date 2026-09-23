import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type QuestionOption = { id: string; text: string };

export type Question = {
  id: string;
  unitId: string;
  primaryConceptId: string;
  type: string;
  difficulty: number;
  language: string;
  prompt: string;
  explanation: string;
  options: QuestionOption[];
  correctOptionId: string;
};

export type Flashcard = {
  id: string;
  unitId: string;
  primaryConceptId: string;
  type: string;
  language: string;
  front: string;
  back: string;
  reversible: boolean;
};

const blockRoot = path.join(process.cwd(), "content", "block-1");

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(blockRoot, relativePath), "utf8")) as T;
}

function unitFiles(directory: string): string[] {
  return readdirSync(path.join(blockRoot, directory))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => `${directory}/${name}`);
}

export const questions: Question[] = unitFiles("questions").flatMap((file) =>
  readJson<Question[]>(file),
);

export const flashcards: Flashcard[] = unitFiles("flashcards").flatMap((file) =>
  readJson<Flashcard[]>(file),
);

const manifest = JSON.parse(
  readFileSync(path.join(blockRoot, "manifest.json"), "utf8"),
) as { unit_index: string };

export const units = readJson<Array<{ unitId: string; title: string; order: number }>>(
  manifest.unit_index,
);

const questionById = new Map(questions.map((question) => [question.id, question]));
const flashcardById = new Map(flashcards.map((flashcard) => [flashcard.id, flashcard]));

export function getQuestion(id: string): Question {
  const question = questionById.get(id);
  if (!question) throw new Error(`Unknown question ${id}`);
  return question;
}

export function getFlashcard(id: string): Flashcard {
  const flashcard = flashcardById.get(id);
  if (!flashcard) throw new Error(`Unknown flashcard ${id}`);
  return flashcard;
}

export function sessionIds(url: string): string[] {
  const parsed = new URL(url);
  return (parsed.searchParams.get("ids") ?? "").split(",").filter(Boolean);
}

export function wrongOptionId(question: Question): string {
  const option = question.options.find((candidate) => candidate.id !== question.correctOptionId);
  if (!option) throw new Error(`Question ${question.id} has no distractor`);
  return option.id;
}
