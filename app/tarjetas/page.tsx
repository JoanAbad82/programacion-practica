import { FlashcardSetup } from "@/components/flashcards/flashcard-setup";
import { getBlockFlashcards } from "@/lib/content/flashcard-content";
import {
  getBlock1ProgressMetadata,
  getBlockProgressMetadata,
} from "@/lib/content/progress-content";
import { getBlockManifest } from "@/lib/content/study-content";

/**
 * Static setup route. The exported document always renders the default
 * (Bloque 1) configuration; `?block=`, `?mode=` and `?unit=` are applied by the
 * client setup component after hydration.
 */
export default async function FlashcardsPage() {
  const [
    b1Metadata,
    b2Metadata,
    b1Cards,
    b2Cards,
    b1Manifest,
    b2Manifest,
  ] = await Promise.all([
    getBlock1ProgressMetadata(),
    getBlockProgressMetadata("B2"),
    getBlockFlashcards("B1"),
    getBlockFlashcards("B2"),
    getBlockManifest("B1"),
    getBlockManifest("B2"),
  ]);

  return (
    <section className="flashcards-page">
      <header className="page-header study-landing-header">
        <span className="eyebrow">Tarjetas · Recuperación activa</span>
        <h1>Tarjetas</h1>
        <p>
          Recuperación activa sobre las {b1Manifest.flashcards} flashcards del
          Bloque 1 y las {b2Manifest.flashcards} del Bloque 2. Primero intenta
          recordar la respuesta, después revélala y evalúa tu recuerdo.
        </p>
      </header>

      <FlashcardSetup
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
            cards: b1Cards,
            concepts: b1Metadata.concepts,
          },
          B2: {
            units: b2Metadata.units,
            cards: b2Cards,
            concepts: b2Metadata.concepts,
          },
        }}
      />
    </section>
  );
}
