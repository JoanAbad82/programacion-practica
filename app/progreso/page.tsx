import { ProgressDashboard } from "@/components/progress/progress-dashboard";
import { getBlockProgressMetadata } from "@/lib/content/progress-content";

export default async function ProgressPage() {
  const [b1, b2] = await Promise.all([
    getBlockProgressMetadata("B1"),
    getBlockProgressMetadata("B2"),
  ]);

  return (
    <section className="progress-page">
      <header className="page-header study-landing-header">
        <span className="eyebrow">Dominio por conceptos · Bloques 1 y 2</span>
        <h1>Progreso</h1>
        <p>
          Una vista única del aprendizaje real: estudio, tests y flashcards se
          combinan por concepto para mostrar qué está nuevo, en aprendizaje,
          comprendido o dominado. Elige el bloque para ver su progreso sin
          mezclar unidades que comparten identificador.
        </p>
      </header>

      <ProgressDashboard
        concepts={[...b1.concepts, ...b2.concepts]}
        units={[...b1.units, ...b2.units]}
      />
    </section>
  );
}
