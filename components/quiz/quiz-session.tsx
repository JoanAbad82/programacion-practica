"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuizQuestionStep } from "./quiz-question-step";
import {
  recordQuizAttempt,
  useQuizHistory,
} from "@/lib/storage/quiz-history";
import type { Question } from "@/types/question";
import type { QuizSessionConfig } from "@/types/quiz";

const modeLabels = {
  BLOCK: "Bloque completo",
  UNIT: "Por unidad",
  ERRORS: "Repasar errores",
  ADAPTIVE: "Adaptativo V1",
} as const;

export function QuizSession({
  config,
  questions,
}: {
  config: QuizSessionConfig;
  questions: Question[];
}) {
  const router = useRouter();
  const history = useQuizHistory();
  const storedSession = history.sessions[config.sessionId];
  const completedAttempts = storedSession?.attempts.length ?? 0;

  if (storedSession?.completedAt) {
    return (
      <section className="quiz-session-state">
        <span className="eyebrow">Sesión completada</span>
        <h1>Este test ya está terminado.</h1>
        <Link
          className="button primary"
          href={`/tests/resultados?sid=${encodeURIComponent(config.sessionId)}`}
        >
          Ver resultados
        </Link>
      </section>
    );
  }

  const question = questions[completedAttempts];

  if (!question) {
    return (
      <section className="quiz-session-state">
        <span className="eyebrow">Sesión sin preguntas pendientes</span>
        <h1>Consulta los resultados o inicia una nueva sesión.</h1>
        <div className="actions">
          <Link
            className="button primary"
            href={`/tests/resultados?sid=${encodeURIComponent(config.sessionId)}`}
          >
            Ver resultados
          </Link>
          <Link className="button" href="/tests">Nuevo test</Link>
        </div>
      </section>
    );
  }

  function continueWithAttempt(
    attempt: Parameters<typeof recordQuizAttempt>[0]["attempt"],
  ) {
    const final = completedAttempts + 1 >= questions.length;

    recordQuizAttempt({
      config,
      attempt,
      completed: final,
    });

    if (final) {
      router.push(
        `/tests/resultados?sid=${encodeURIComponent(config.sessionId)}`,
      );
    }
  }

  return (
    <section className="quiz-session-page">
      <header className="quiz-session-header">
        <div>
          <span className="eyebrow">{modeLabels[config.mode]}</span>
          <p>
            Session ID: <code>{config.sessionId}</code> · Seed:{" "}
            <code>{config.seed}</code>
          </p>
        </div>
        <Link className="button" href="/tests">Salir</Link>
      </header>

      <QuizQuestionStep
        index={completedAttempts}
        key={`${config.sessionId}-${question.id}`}
        onContinue={continueWithAttempt}
        question={question}
        seed={config.seed}
        total={questions.length}
      />
    </section>
  );
}
