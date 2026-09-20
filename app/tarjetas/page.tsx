import { FlashcardSetup } from "@/components/flashcards/flashcard-setup";
import { getBlock1Flashcards } from "@/lib/content/flashcard-content";
import { getBlock1Units } from "@/lib/content/study-content";
import type { FlashcardMode } from "@/types/flashcard-session";

function normalizeMode(value: string | undefined): FlashcardMode {
  return value?.toLowerCase() === "adaptive" ? "ADAPTIVE" : "MIXED";
}

export default async function FlashcardsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;

  const [cards, units] = await Promise.all([
    getBlock1Flashcards(),
    getBlock1Units(),
  ]);

  return (
    <section className="flashcards-page">
      <header className="page-header study-landing-header">
        <span className="eyebrow">Phase 5 — Flashcards Engine</span>
        <h1>Tarjetas</h1>
        <p>
          Recuperación activa sobre las 80 flashcards validadas del Bloque 1.
          Primero intenta recordar la respuesta, después revélala y evalúa tu
          recuerdo.
        </p>
      </header>

      <FlashcardSetup
        cards={cards}
        initialMode={normalizeMode(rawMode)}
        units={units.map((unit) => ({
          unitId: unit.unitId,
          title: unit.title,
        }))}
      />
    </section>
  );
}
