import Link from "next/link";
import { QuizResults } from "@/components/quiz/quiz-results";
import { getBlock1Questions } from "@/lib/content/quiz-content";

export default async function QuizResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ sid?: string | string[] }>;
}) {
  const params = await searchParams;
  const sessionId = Array.isArray(params.sid) ? params.sid[0] : params.sid;

  if (!sessionId) {
    return (
      <section className="quiz-session-state">
        <span className="eyebrow">Resultados</span>
        <h1>Falta el identificador de sesión.</h1>
        <Link className="button primary" href="/tests">Volver a Tests</Link>
      </section>
    );
  }

  return (
    <QuizResults
      questions={await getBlock1Questions()}
      sessionId={sessionId}
    />
  );
}
