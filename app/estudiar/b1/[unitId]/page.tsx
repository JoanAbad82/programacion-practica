import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnitStudyReader } from "@/components/study/unit-study-reader";
import {
  getAdjacentUnits,
  getBlock1UnitBySlug,
  getBlock1Units,
} from "@/lib/content/study-content";

export const dynamicParams = false;

export async function generateStaticParams() {
  const units = await getBlock1Units();
  return units.map((unit) => ({ unitId: unit.unitId.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ unitId: string }>;
}): Promise<Metadata> {
  const { unitId } = await params;
  const unit = await getBlock1UnitBySlug(unitId);

  return unit
    ? {
        title: `${unit.unitId} — ${unit.title} | Programación Práctica`,
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
  const unit = await getBlock1UnitBySlug(unitId);
  if (!unit) notFound();

  const { previous, next } = await getAdjacentUnits(unit.slug);

  return (
    <UnitStudyReader
      blockId="B1"
      next={next}
      previous={previous}
      unit={unit}
    />
  );
}
