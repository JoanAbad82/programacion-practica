"use client";

import Link from "next/link";
import { QuizResults } from "@/components/quiz/quiz-results";
import { questionsForBlock } from "@/lib/content/client-bank";
import { parseBlockParam } from "@/lib/content/session-params";
import { useClientSearchParams } from "@/lib/navigation/search-params";

/**
 * Static results route. The exported HTML renders the controlled
 * "missing session id" state and the browser resolves `?sid=` (and the optional
 * `?block=`) after hydration. Historical links without `block` remain valid
 * and resolve as Bloque 1.
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

  const blockId = parseBlockParam(searchParams.get("block"), "B1");

  return (
    <QuizResults questions={questionsForBlock(blockId)} sessionId={sessionId} />
  );
}
