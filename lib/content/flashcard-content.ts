import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Flashcard } from "@/types/flashcard";
import type { FlashcardMeta } from "@/types/flashcard-session";
import { activeFlashcards, BLOCK1_UNIT_FILES } from "./bank";

const flashcardRoot = path.join(
  process.cwd(),
  "content",
  "block-1",
  "flashcards",
);

export async function getBlock1Flashcards(): Promise<Flashcard[]> {
  const groups = await Promise.all(
    BLOCK1_UNIT_FILES.map(async (file) => {
      const raw = await readFile(path.join(flashcardRoot, file), "utf8");
      return JSON.parse(raw) as Flashcard[];
    }),
  );

  return activeFlashcards(groups);
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
