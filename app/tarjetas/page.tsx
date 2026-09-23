import { FlashcardSetup } from "@/components/flashcards/flashcard-setup";
import { getBlock1Flashcards } from "@/lib/content/flashcard-content";
import { getBlock1Units } from "@/lib/content/study-content";
import { getBlock1Concepts } from "@/lib/content/progress-content";

/**
 * Static setup route. The exported document always renders the default
 * configuration; `?mode=` and `?unit=` are applied by the client setup
 * component after hydration.
 */
export default async function FlashcardsPage() {
  const [cards, units, concepts] = await Promise.all([
    getBlock1Flashcards(),
    getBlock1Units(),
    getBlock1Concepts(),
  ]);

  return (
    <section className="flashcards-page">
      <header className="page-header study-landing-header">
        <span className="eyebrow">Bloque 1 · Recuperación activa</span>
        <h1>Tarjetas</h1>
        <p>
          Recuperación activa sobre las 80 flashcards validadas del Bloque 1.
          Primero intenta recordar la respuesta, después revélala y evalúa tu
          recuerdo.
        </p>
      </header>

      <FlashcardSetup
        cards={cards}
        concepts={concepts}
        units={units}
      />
    </section>
  );
}
