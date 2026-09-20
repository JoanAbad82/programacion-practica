import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Flashcard } from "@/types/flashcard";
import type { FlashcardMeta } from "@/types/flashcard-session";

const flashcardRoot = path.join(
  process.cwd(),
  "content",
  "block-1",
  "flashcards",
);

export async function getBlock1Flashcards(): Promise<Flashcard[]> {
  const files = Array.from(
    { length: 12 },
    (_, index) => `u${String(index + 1).padStart(2, "0")}.json`,
  );

  const groups = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(flashcardRoot, file), "utf8");
      return JSON.parse(raw) as Flashcard[];
    }),
  );

  return groups
    .flat()
    .filter((card) => card.status === "ACTIVE")
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function getBlock1FlashcardMetas(): Promise<FlashcardMeta[]> {
  return (await getBlock1Flashcards()).map((card) => ({
    id: card.id,
    unitId: card.unitId,
    primaryConceptId: card.primaryConceptId,
    type: card.type,
    language: card.language,
    reversible: card.reversible,
  }));
}
