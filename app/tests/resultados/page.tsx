"use client";

import Link from "next/link";
import { QuizResults } from "@/components/quiz/quiz-results";
import { block1Questions } from "@/lib/content/client-bank";
import { useClientSearchParams } from "@/lib/navigation/search-params";

/**
 * Static results route. The exported HTML renders the controlled
 * "missing session id" state and the browser resolves `?sid=` after hydration.
 */
export default function QuizResultsPage() {
  const searchParams = useClientSearchParams();
  const sessionId = searchParams.get("sid");

  if (!sessionId) {
    return (
      <section className="quiz-session-state">
        <span className="eyebrow">Resultados</span>
        <h1>Falta el identificador de sesión.</h1>
        <Link className="button primary" href="/tests">Volver a Tests</Link>
      </section>
    );
  }

  return <QuizResults questions={block1Questions} sessionId={sessionId} />;
}
