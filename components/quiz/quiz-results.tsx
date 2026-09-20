"use client";

import Link from "next/link";
import { useMemo } from "react";
import { QuizRichText } from "./quiz-rich-text";
import { useQuizHistory } from "@/lib/storage/quiz-history";
import type { Question } from "@/types/question";

export function QuizResults({
  sessionId,
  questions,
}: {
  sessionId: string;
  questions: Question[];
}) {
  const history = useQuizHistory();
  const session = history.sessions[sessionId];

  const questionMap = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions],
  );

  if (!session) {
    return (
      <section className="quiz-session-state">
        <span className="eyebrow">Resultados</span>
        <h1>No encuentro esta sesión en el historial local.</h1>
        <p>
          Si has abierto el enlace en otro navegador o has borrado los datos
          locales, inicia una nueva sesión.
        </p>
        <Link className="button primary" href="/tests">Ir a Tests</Link>
      </section>
    );
  }

  const correct = session.attempts.filter((attempt) => attempt.correct).length;
  const total = session.attempts.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrong = session.attempts.filter((attempt) => !attempt.correct);

  const difficultyStats = [1, 2, 3].map((difficulty) => {
    const attempts = session.attempts.filter(
      (attempt) => attempt.difficulty === difficulty,
    );
    return {
      difficulty,
      correct: attempts.filter((attempt) => attempt.correct).length,
      total: attempts.length,
    };
  });

  return (
    <section className="quiz-results-page">
      <header className="quiz-results-hero">
        <span className="eyebrow">Resultados</span>
        <h1>{correct} / {total}</h1>
        <p className="quiz-results-percentage">{percentage}% correctas</p>
        <p>
          Session ID: <code>{session.sessionId}</code> · Seed:{" "}
          <code>{session.seed}</code>
        </p>
      </header>

      <div className="quiz-results-grid">
        {difficultyStats.map((item) => (
          <div className="card" key={item.difficulty}>
            <span>Nivel {item.difficulty}</span>
            <strong className="metric">
              {item.correct}/{item.total}
            </strong>
          </div>
        ))}
      </div>

      <div className="actions quiz-results-actions">
        <Link className="button primary" href="/tests">Nuevo test</Link>
        {wrong.length > 0 ? (
          <Link className="button" href="/tests?mode=errors">
            Repasar errores
          </Link>
        ) : null}
        {session.unitId ? (
          <Link
            className="button"
            href={`/estudiar/b1/${session.unitId.toLowerCase()}`}
          >
            Volver a la unidad
          </Link>
        ) : null}
      </div>

      <section className="quiz-error-review" aria-labelledby="errores-sesion">
        <div>
          <span className="eyebrow">Revisión</span>
          <h2 id="errores-sesion">
            {wrong.length > 0
              ? `${wrong.length} respuestas para revisar`
              : "Sin errores en esta sesión"}
          </h2>
        </div>

        {wrong.length > 0 ? (
          <div className="quiz-error-list">
            {wrong.map((attempt) => {
              const question = questionMap.get(attempt.questionId);
              const selected = question?.options.find(
                (option) => option.id === attempt.selectedOptionId,
              );
              const expected = question?.options.find(
                (option) => option.id === attempt.correctOptionId,
              );

              if (!question) return null;

              return (
                <article className="quiz-error-item" key={attempt.questionId}>
                  <span className="quiz-error-id">{attempt.questionId}</span>
                  <h3><QuizRichText text={question.prompt} /></h3>
                  {selected ? (
                    <p>
                      Tu respuesta: <QuizRichText compact text={selected.text} />
                    </p>
                  ) : null}
                  {expected ? (
                    <p>
                      Correcta: <QuizRichText compact text={expected.text} />
                    </p>
                  ) : null}
                  <p><QuizRichText text={question.explanation} /></p>
                </article>
              );
            })}
          </div>
        ) : (
          <p>
            No hay errores que añadir al modo de repaso desde esta sesión.
          </p>
        )}
      </section>
    </section>
  );
}
