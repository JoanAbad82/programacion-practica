import { ProgressDashboard } from "@/components/progress/progress-dashboard";
import { getBlock1ProgressMetadata } from "@/lib/content/progress-content";

export default async function ProgressPage() {
  const { concepts, units } = await getBlock1ProgressMetadata();

  return (
    <section className="progress-page">
      <header className="page-header study-landing-header">
        <span className="eyebrow">Bloque 1 · Dominio por conceptos</span>
        <h1>Progreso</h1>
        <p>
          Una vista única del aprendizaje real: estudio, tests y flashcards se
          combinan por concepto para mostrar qué está nuevo, en aprendizaje,
          comprendido o dominado.
        </p>
      </header>

      <ProgressDashboard concepts={concepts} units={units} />
    </section>
  );
}
