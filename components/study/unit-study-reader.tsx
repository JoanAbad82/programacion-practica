import Link from "next/link";
import { StudyContent } from "@/components/study/study-content";
import { UnitProgressControls } from "@/components/study/unit-progress-controls";
import { BLOCK_LABELS, type BlockId } from "@/types/block";
import type { StudyUnitDocument, StudyUnitMeta } from "@/types/study";

export function UnitStudyReader({
  blockId,
  unit,
  previous,
  next,
}: {
  blockId: BlockId;
  unit: StudyUnitDocument;
  previous: StudyUnitMeta | null;
  next: StudyUnitMeta | null;
}) {
  const blockSlug = blockId.toLowerCase();

  return (
    <article className="unit-study-page">
      <nav className="breadcrumbs" aria-label="Migas de pan">
        <Link href="/estudiar">Estudiar</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/estudiar/${blockSlug}`}>{BLOCK_LABELS[blockId]}</Link>
        <span aria-hidden="true">/</span>
        <span>{unit.unitId}</span>
      </nav>

      <header className="unit-study-header">
        <span className="eyebrow">Unidad {String(unit.order).padStart(2, "0")}</span>
        <h1>{unit.title}</h1>
        <p className="unit-objective">{unit.objective}</p>
        <UnitProgressControls blockId={blockId} unitId={unit.unitId} />
      </header>

      <StudyContent sections={unit.sections} />

      <aside className="practice-panel">
        <div>
          <span className="eyebrow">Consolidar</span>
          <h2>Practicar esta unidad</h2>
          <p>
            Pon a prueba lo estudiado con las preguntas del {BLOCK_LABELS[blockId]}.
            La sesión se abre ya filtrada por esta unidad.
          </p>
        </div>
        <Link
          className="button primary"
          href={`/tests?block=${blockSlug}&unit=${unit.slug}`}
        >
          Ir a práctica de {unit.unitId}
        </Link>
      </aside>

      <nav className="unit-navigation" aria-label="Navegación entre unidades">
        <div>
          {previous ? (
            <Link href={`/estudiar/${blockSlug}/${previous.unitId.toLowerCase()}`}>
              <span>← Anterior</span>
              <strong>{previous.title}</strong>
            </Link>
          ) : (
            <Link href={`/estudiar/${blockSlug}`}>
              <span>← Volver</span>
              <strong>Índice del bloque</strong>
            </Link>
          )}
        </div>
        <div className="unit-navigation-next">
          {next ? (
            <Link href={`/estudiar/${blockSlug}/${next.unitId.toLowerCase()}`}>
              <span>Siguiente →</span>
              <strong>{next.title}</strong>
            </Link>
          ) : (
            <Link href={`/tests?block=${blockSlug}`}>
              <span>Siguiente →</span>
              <strong>Practicar {BLOCK_LABELS[blockId]}</strong>
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
