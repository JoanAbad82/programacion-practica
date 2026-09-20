"use client";

import Link from "next/link";
import { useFlashcardHistory } from "@/lib/storage/flashcard-history";

export function FlashcardResults({ sessionId }: { sessionId: string }) {
  const history = useFlashcardHistory();
  const session = history.sessions[sessionId];

  if (!session) {
    return (
      <section className="flashcard-session-state">
        <span className="eyebrow">Resultados</span>
        <h1>No encuentro esta sesión en el historial local.</h1>
        <Link className="button primary" href="/tarjetas">
          Ir a Tarjetas
        </Link>
      </section>
    );
  }

  const miss = session.attempts.filter(
    (attempt) => attempt.rating === "MISS",
  ).length;
  const doubt = session.attempts.filter(
    (attempt) => attempt.rating === "DOUBT",
  ).length;
  const know = session.attempts.filter(
    (attempt) => attempt.rating === "KNOW",
  ).length;

  const finalRatingByCard = new Map<string, string>();

  for (const attempt of session.attempts) {
    finalRatingByCard.set(attempt.cardId, attempt.rating);
  }

  const consolidated = [...finalRatingByCard.values()].filter(
    (rating) => rating === "KNOW",
  ).length;
  const reviewed = finalRatingByCard.size;

  return (
    <section className="flashcard-results-page">
      <header className="flashcard-results-hero">
        <span className="eyebrow">Resultados de tarjetas</span>
        <h1>{consolidated} / {reviewed}</h1>
        <p className="flashcard-results-subtitle">
          tarjetas terminadas con “La sabía”
        </p>
        <p>
          Session ID: <code>{session.sessionId}</code> · Seed:{" "}
          <code>{session.seed}</code>
        </p>
      </header>

      <div className="flashcard-results-grid">
        <div className="card">
          <span>No la sabía</span>
          <strong className="metric">{miss}</strong>
        </div>
        <div className="card">
          <span>Dudé</span>
          <strong className="metric">{doubt}</strong>
        </div>
        <div className="card">
          <span>La sabía</span>
          <strong className="metric">{know}</strong>
        </div>
      </div>

      <div className="actions flashcard-results-actions">
        <Link className="button primary" href="/tarjetas">
          Nueva sesión
        </Link>
        <Link className="button" href="/tarjetas?mode=adaptive">
          Repaso adaptativo
        </Link>
      </div>

      <section className="flashcard-results-note">
        <span className="eyebrow">Cómo interpretar el resultado</span>
        <p>
          Las repeticiones forman parte del entrenamiento. Una tarjeta puede
          aparecer varias veces si marcaste “No la sabía” o “Dudé”.
        </p>
      </section>
    </section>
  );
}
