import { QuizSetup } from "@/components/quiz/quiz-setup";
import { getBlock1QuestionMetas } from "@/lib/content/quiz-content";
import { getBlock1Units } from "@/lib/content/study-content";
import { getBlock1Concepts } from "@/lib/content/progress-content";

/**
 * Static setup route. The exported document always renders the default
 * configuration; `?unit=` and `?mode=` (used by unit links and the
 * error-review links) are applied by the client setup component.
 */
export default async function TestsPage() {
  const [units, questions, concepts] = await Promise.all([
    getBlock1Units(),
    getBlock1QuestionMetas(),
    getBlock1Concepts(),
  ]);

  return (
    <section className="quiz-page">
      <header className="page-header study-landing-header">
        <span className="eyebrow">Bloque 1 · Práctica objetiva</span>
        <h1>Tests</h1>
        <p>
          Practica con las 200 preguntas validadas del Bloque 1. Cada sesión
          conserva un identificador y una semilla para poder reproducir su
          selección y el orden de las respuestas.
        </p>
      </header>

      <QuizSetup
        concepts={concepts}
        questions={questions}
        units={units}
      />
    </section>
  );
}
