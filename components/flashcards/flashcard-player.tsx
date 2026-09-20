"use client";

import { useState } from "react";
import { FlashcardRichText } from "./flashcard-rich-text";
import type { Flashcard } from "@/types/flashcard";
import type {
  FlashcardDirection,
  FlashcardRating,
} from "@/types/flashcard-session";

const ratingLabels: Record<FlashcardRating, string> = {
  MISS: "No la sabía",
  DOUBT: "Dudé",
  KNOW: "La sabía",
};

export function FlashcardPlayer({
  card,
  direction,
  exposure,
  position,
  remaining,
  onRate,
}: {
  card: Flashcard;
  direction: FlashcardDirection;
  exposure: number;
  position: number;
  remaining: number;
  onRate: (rating: FlashcardRating) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  const front =
    direction === "FRONT_TO_BACK" ? card.front : card.back;
  const back =
    direction === "FRONT_TO_BACK" ? card.back : card.front;

  return (
    <article className="flashcard-session-card">
      <div className="flashcard-session-topline">
        <span>Tarjeta {position}</span>
        <span>{remaining} pendientes · {card.id}</span>
      </div>

      <div className="flashcard-session-meta">
        <span>{card.unitId}</span>
        <span>{card.type}</span>
        <span>{card.language.replace("_", " ↔ ")}</span>
        {exposure > 1 ? <span>Repetición {exposure}</span> : null}
      </div>

      <section className="flashcard-face" aria-live="polite">
        <span className="eyebrow">
          {revealed ? "Respuesta" : "Recuerda antes de revelar"}
        </span>
        <div className="flashcard-face-content">
          <FlashcardRichText text={revealed ? back : front} />
        </div>
      </section>

      {!revealed ? (
        <button
          className="button primary flashcard-reveal-button"
          onClick={() => setRevealed(true)}
          type="button"
        >
          Mostrar respuesta
        </button>
      ) : (
        <section className="flashcard-rating-panel">
          <p>¿Cómo fue tu recuerdo?</p>
          <div className="flashcard-rating-actions">
            {(Object.keys(ratingLabels) as FlashcardRating[]).map((rating) => (
              <button
                className={`button flashcard-rating ${rating.toLowerCase()}`}
                key={rating}
                onClick={() => onRate(rating)}
                type="button"
              >
                {ratingLabels[rating]}
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
