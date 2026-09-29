import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export type BlockSlug = "b1" | "b2";

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

function blockRoot(slug: BlockSlug): string {
  return path.join(process.cwd(), "content", slug === "b2" ? "block-2" : "block-1");
}

function readJson<T>(slug: BlockSlug, relativePath: string): T {
  return JSON.parse(
    readFileSync(path.join(blockRoot(slug), relativePath), "utf8"),
  ) as T;
}

function unitFiles(slug: BlockSlug, directory: string): string[] {
  return readdirSync(path.join(blockRoot(slug), directory))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => `${directory}/${name}`);
}

function loadQuestions(slug: BlockSlug): Question[] {
  return unitFiles(slug, "questions").flatMap((file) =>
    readJson<Question[]>(slug, file),
  );
}

function loadFlashcards(slug: BlockSlug): Flashcard[] {
  return unitFiles(slug, "flashcards").flatMap((file) =>
    readJson<Flashcard[]>(slug, file),
  );
}

function loadUnits(slug: BlockSlug) {
  const manifest = readJson<{ unit_index: string }>(slug, "manifest.json");
  return readJson<Array<{ unitId: string; title: string; order: number }>>(
    slug,
    manifest.unit_index,
  );
}

const questionBank: Record<BlockSlug, Question[]> = {
  b1: loadQuestions("b1"),
  b2: loadQuestions("b2"),
};

const flashcardBank: Record<BlockSlug, Flashcard[]> = {
  b1: loadFlashcards("b1"),
  b2: loadFlashcards("b2"),
};

const unitBank: Record<BlockSlug, Array<{ unitId: string; title: string; order: number }>> = {
  b1: loadUnits("b1"),
  b2: loadUnits("b2"),
};

const questionById = new Map(
  [...questionBank.b1, ...questionBank.b2].map((question) => [question.id, question]),
);
const flashcardById = new Map(
  [...flashcardBank.b1, ...flashcardBank.b2].map((card) => [card.id, card]),
);

// Bloque 1 stays the default so existing suites keep their original meaning.
export const questions: Question[] = questionBank.b1;
export const flashcards: Flashcard[] = flashcardBank.b1;
export const units = unitBank.b1;

export function questionsFor(slug: BlockSlug): Question[] {
  return questionBank[slug];
}

export function flashcardsFor(slug: BlockSlug): Flashcard[] {
  return flashcardBank[slug];
}

export function unitsFor(slug: BlockSlug) {
  return unitBank[slug];
}

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
