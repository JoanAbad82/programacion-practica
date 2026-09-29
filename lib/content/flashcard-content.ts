import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Flashcard } from "@/types/flashcard";
import type { FlashcardMeta } from "@/types/flashcard-session";
import type { BlockId } from "@/types/block";
import { activeFlashcards, blockUnitFiles } from "./bank";
import { blockContentRoot } from "./blocks";

export async function getBlockFlashcards(blockId: BlockId): Promise<Flashcard[]> {
  const flashcardRoot = path.join(blockContentRoot(blockId), "flashcards");
  const groups = await Promise.all(
    blockUnitFiles().map(async (file) => {
      const raw = await readFile(path.join(flashcardRoot, file), "utf8");
      return JSON.parse(raw) as Flashcard[];
    }),
  );

  return activeFlashcards(groups);
}

export async function getBlockFlashcardMetas(
  blockId: BlockId,
): Promise<FlashcardMeta[]> {
  return (await getBlockFlashcards(blockId)).map((card) => ({
    id: card.id,
    unitId: card.unitId,
    primaryConceptId: card.primaryConceptId,
    type: card.type,
    language: card.language,
    reversible: card.reversible,
  }));
}

/* Backwards-compatible Bloque 1 wrappers. */

export function getBlock1Flashcards(): Promise<Flashcard[]> {
  return getBlockFlashcards("B1");
}

export function getBlock1FlashcardMetas(): Promise<FlashcardMeta[]> {
  return getBlockFlashcardMetas("B1");
}
