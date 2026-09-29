import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnitStudyReader } from "@/components/study/unit-study-reader";
import {
  getBlockAdjacentUnits,
  getBlockUnitBySlug,
  getBlockUnits,
} from "@/lib/content/study-content";

export const dynamicParams = false;

export async function generateStaticParams() {
  const units = await getBlockUnits("B2");
  return units.map((unit) => ({ unitId: unit.unitId.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ unitId: string }>;
}): Promise<Metadata> {
  const { unitId } = await params;
  const unit = await getBlockUnitBySlug("B2", unitId);

  return unit
    ? {
        title: `${unit.unitId} — ${unit.title} | Bloque 2 | Programación Práctica`,
        description: unit.objective,
      }
    : {};
}

export default async function UnitStudyPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const unit = await getBlockUnitBySlug("B2", unitId);
  if (!unit) notFound();

  const { previous, next } = await getBlockAdjacentUnits("B2", unit.slug);

  return (
    <UnitStudyReader
      blockId="B2"
      next={next}
      previous={previous}
      unit={unit}
    />
  );
}
