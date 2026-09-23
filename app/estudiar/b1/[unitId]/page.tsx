import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StudyContent } from "@/components/study/study-content";
import { UnitProgressControls } from "@/components/study/unit-progress-controls";
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
    <article className="unit-study-page">
      <nav className="breadcrumbs" aria-label="Migas de pan">
        <Link href="/estudiar">Estudiar</Link>
        <span aria-hidden="true">/</span>
        <Link href="/estudiar/b1">Bloque 1</Link>
        <span aria-hidden="true">/</span>
        <span>{unit.unitId}</span>
      </nav>

      <header className="unit-study-header">
        <span className="eyebrow">Unidad {String(unit.order).padStart(2, "0")}</span>
        <h1>{unit.title}</h1>
        <p className="unit-objective">{unit.objective}</p>
        <UnitProgressControls unitId={unit.unitId} />
      </header>

      <StudyContent sections={unit.sections} />

      <aside className="practice-panel">
        <div>
          <span className="eyebrow">Consolidar</span>
          <h2>Practicar esta unidad</h2>
          <p>
            Pon a prueba lo estudiado con las preguntas del Bloque 1. La
            sesión se abre ya filtrada por esta unidad.
          </p>
        </div>
        <Link className="button primary" href={`/tests?unit=${unit.slug}`}>
          Ir a práctica de {unit.unitId}
        </Link>
      </aside>

      <nav className="unit-navigation" aria-label="Navegación entre unidades">
        <div>
          {previous ? (
            <Link href={`/estudiar/b1/${previous.unitId.toLowerCase()}`}>
              <span>← Anterior</span>
              <strong>{previous.title}</strong>
            </Link>
          ) : (
            <Link href="/estudiar/b1">
              <span>← Volver</span>
              <strong>Índice del bloque</strong>
            </Link>
          )}
        </div>
        <div className="unit-navigation-next">
          {next ? (
            <Link href={`/estudiar/b1/${next.unitId.toLowerCase()}`}>
              <span>Siguiente →</span>
              <strong>{next.title}</strong>
            </Link>
          ) : (
            <Link href="/tests?block=b1">
              <span>Siguiente →</span>
              <strong>Practicar Bloque 1</strong>
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
