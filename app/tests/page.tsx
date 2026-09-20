import Link from "next/link";
import { getBlock1UnitBySlug, normalizeUnitSlug } from "@/lib/content/study-content";

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ unit?: string | string[]; block?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawUnit = Array.isArray(params.unit) ? params.unit[0] : params.unit;
  const unitSlug = rawUnit ? normalizeUnitSlug(rawUnit) : null;
  const unit = unitSlug ? await getBlock1UnitBySlug(unitSlug) : null;

  return (
    <section>
      <header className="page-header">
        <span className="eyebrow">Phase 4 pendiente</span>
        <h1>Tests</h1>
        <p>
          El banco de 200 preguntas ya está validado. El motor interactivo se implementará en la siguiente fase.
        </p>
      </header>

      {unit ? (
        <div className="selected-practice-context">
          <span className="eyebrow">Contexto recibido</span>
          <h2>{unit.unitId} — {unit.title}</h2>
          <p>La experiencia de estudio ha enviado correctamente esta unidad al futuro motor de práctica.</p>
          <Link className="button" href={`/estudiar/b1/${unit.slug}`}>Volver a la unidad</Link>
        </div>
      ) : (
        <div className="selected-practice-context">
          <strong>Bloque 1 preparado</strong>
          <p>Phase 4 añadirá selección de sesión, respuestas, explicaciones y resultados.</p>
        </div>
      )}
    </section>
  );
}
