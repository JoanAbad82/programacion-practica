"use client";

import Link from "next/link";
import { FlashcardResults } from "@/components/flashcards/flashcard-results";
import { useClientSearchParams } from "@/lib/navigation/search-params";

/**
 * Static flashcard results route: the exported HTML renders the controlled
 * "missing session id" state and the browser resolves `?sid=` after hydration.
 */
export default function FlashcardResultsPage() {
  const searchParams = useClientSearchParams();
  const sessionId = searchParams.get("sid");

  if (!sessionId) {
    return (
      <section className="flashcard-session-state">
        <span className="eyebrow">Resultados</span>
        <h1>Falta el identificador de sesión.</h1>
        <Link className="button primary" href="/tarjetas">
          Volver a Tarjetas
        </Link>
      </section>
    );
  }

  return <FlashcardResults sessionId={sessionId} />;
}
