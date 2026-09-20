import Link from "next/link";
import { FlashcardResults } from "@/components/flashcards/flashcard-results";

export default async function FlashcardResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string | string[] }>;
}) {
  const params = await searchParams;
  const sessionId = Array.isArray(params.sid) ? params.sid[0] : params.sid;

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
