import { QuizSetup } from "@/components/quiz/quiz-setup";
import { getBlock1QuestionMetas } from "@/lib/content/quiz-content";
import {
  getBlock1Units,
  normalizeUnitSlug,
} from "@/lib/content/study-content";
import { getBlock1Concepts } from "@/lib/content/progress-content";
import type { QuizMode } from "@/types/quiz";

function normalizeMode(value: string | undefined): QuizMode {
  switch (value?.toLowerCase()) {
    case "unit":
      return "UNIT";
    case "errors":
      return "ERRORS";
    case "adaptive":
      return "ADAPTIVE";
    default:
      return "BLOCK";
  }
}

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    unit?: string | string[];
    mode?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const rawUnit = Array.isArray(params.unit) ? params.unit[0] : params.unit;
  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const normalizedSlug = rawUnit ? normalizeUnitSlug(rawUnit) : null;
  const [units, questions, concepts] = await Promise.all([
    getBlock1Units(),
    getBlock1QuestionMetas(),
    getBlock1Concepts(),
  ]);

  const unit = normalizedSlug
    ? units.find(
        (candidate) =>
          candidate.unitId.toLowerCase() === normalizedSlug,
      ) ?? null
    : null;

  const initialMode = unit ? "UNIT" : normalizeMode(rawMode);

  return (
    <section className="quiz-page">
      <header className="page-header study-landing-header">
        <span className="eyebrow">Phase 4 — Quiz Engine</span>
        <h1>Tests</h1>
        <p>
          Practica con las 200 preguntas validadas del Bloque 1. Cada sesión
          conserva un identificador y una semilla para poder reproducir su
          selección y el orden de las respuestas.
        </p>
      </header>

      <QuizSetup
        concepts={concepts}
        initialMode={initialMode}
        initialUnitId={unit?.unitId ?? null}
        questions={questions}
        units={units}
      />
    </section>
  );
}
