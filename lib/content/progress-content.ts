import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Concept } from "@/types/content";
import type { StudyUnitMeta } from "@/types/study";
import type { BlockId } from "@/types/block";
import { blockContentRoot } from "./blocks";

function isActiveUnit(unit: StudyUnitMeta): boolean {
  const status = (unit as { status?: string }).status;
  return status === "ACTIVE" || status === "APPROVED_SPEC";
}

export async function getBlockConcepts(blockId: BlockId): Promise<Concept[]> {
  const raw = await readFile(
    path.join(blockContentRoot(blockId), "concepts", "concepts.json"),
    "utf8",
  );

  return (JSON.parse(raw) as Concept[])
    .filter((concept) => concept.status === "ACTIVE")
    .sort((a, b) => a.conceptId.localeCompare(b.conceptId));
}

export async function getBlockProgressMetadata(blockId: BlockId): Promise<{
  concepts: Concept[];
  units: StudyUnitMeta[];
}> {
  const [concepts, rawUnits] = await Promise.all([
    getBlockConcepts(blockId),
    readFile(
      path.join(blockContentRoot(blockId), "canonical", "units.json"),
      "utf8",
    ),
  ]);

  const units = (JSON.parse(rawUnits) as StudyUnitMeta[])
    .filter(isActiveUnit)
    .sort((a, b) => a.order - b.order);

  return { concepts, units };
}

/* Backwards-compatible Bloque 1 wrappers. */

export function getBlock1Concepts(): Promise<Concept[]> {
  return getBlockConcepts("B1");
}

export function getBlock1ProgressMetadata() {
  return getBlockProgressMetadata("B1");
}
