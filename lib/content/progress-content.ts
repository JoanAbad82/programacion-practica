import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Concept } from "@/types/content";
import type { StudyUnitMeta } from "@/types/study";

const blockRoot = path.join(process.cwd(), "content", "block-1");

export async function getBlock1Concepts(): Promise<Concept[]> {
  const raw = await readFile(
    path.join(blockRoot, "concepts", "concepts.json"),
    "utf8",
  );

  return (JSON.parse(raw) as Concept[])
    .filter((concept) => concept.status === "ACTIVE")
    .sort((a, b) => a.conceptId.localeCompare(b.conceptId));
}

export async function getBlock1ProgressMetadata(): Promise<{
  concepts: Concept[];
  units: StudyUnitMeta[];
}> {
  const [concepts, rawUnits] = await Promise.all([
    getBlock1Concepts(),
    readFile(path.join(blockRoot, "canonical", "units.json"), "utf8"),
  ]);

  const units = (JSON.parse(rawUnits) as StudyUnitMeta[])
    .filter((unit) => unit.status === "ACTIVE")
    .sort((a, b) => a.order - b.order);

  return { concepts, units };
}
