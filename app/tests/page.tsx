import { QuizSetup } from "@/components/quiz/quiz-setup";
import { getBlockQuestionMetas } from "@/lib/content/quiz-content";
import {
  getBlock1ProgressMetadata,
  getBlockProgressMetadata,
} from "@/lib/content/progress-content";
import { getBlockManifest } from "@/lib/content/study-content";

/**
 * Static setup route. The exported document always renders the default
 * (Bloque 1) configuration; `?block=`, `?unit=` and `?mode=` (used by unit
 * links and error-review links) are applied by the client setup component.
 */
export default async function TestsPage() {
  const [
    b1Metadata,
    b2Metadata,
    b1Questions,
    b2Questions,
    b1Manifest,
    b2Manifest,
  ] = await Promise.all([
    getBlock1ProgressMetadata(),
    getBlockProgressMetadata("B2"),
    getBlockQuestionMetas("B1"),
    getBlockQuestionMetas("B2"),
    getBlockManifest("B1"),
    getBlockManifest("B2"),
  ]);

  return (
    <section className="quiz-page">
      <header className="page-header study-landing-header">
        <span className="eyebrow">Tests · Práctica objetiva</span>
        <h1>Tests</h1>
        <p>
          Elige Bloque 1 o Bloque 2 y practica con sus preguntas validadas
          ({b1Manifest.questions} y {b2Manifest.questions} respectivamente).
          Cada sesión conserva un identificador y una semilla para poder
          reproducir su selección y el orden de las respuestas.
        </p>
      </header>

      <QuizSetup
        blockCounts={{
          B1: {
            questions: b1Manifest.questions,
            flashcards: b1Manifest.flashcards,
          },
          B2: {
            questions: b2Manifest.questions,
            flashcards: b2Manifest.flashcards,
          },
        }}
        blockLibraries={{
          B1: {
            units: b1Metadata.units,
            questions: b1Questions,
            concepts: b1Metadata.concepts,
          },
          B2: {
            units: b2Metadata.units,
            questions: b2Questions,
            concepts: b2Metadata.concepts,
          },
        }}
      />
    </section>
  );
}
