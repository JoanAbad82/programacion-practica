"use client";

import { useEffect, useRef, useState } from "react";
import { FlashcardRichText } from "./flashcard-rich-text";
import type { Flashcard } from "@/types/flashcard";
import type { FlashcardDirection, FlashcardRating } from "@/types/flashcard-session";

const ratingCopy: Record<FlashcardRating, { label: string; help: string }> = {
  MISS: { label: "No la sabía", help: "Repetir pronto" },
  DOUBT: { label: "Dudé", help: "Repetir más adelante" },
  KNOW: { label: "La sabía", help: "Reducir frecuencia" },
};

export function FlashcardPlayer({ card, direction, exposure, position, remaining, onRate }: {
  card: Flashcard;
  direction: FlashcardDirection;
  exposure: number;
  position: number;
  remaining: number;
  onRate: (rating: FlashcardRating) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const ratingRef = useRef<HTMLFieldSetElement>(null);
  const front = direction === "FRONT_TO_BACK" ? card.front : card.back;
  const back = direction === "FRONT_TO_BACK" ? card.back : card.front;

  useEffect(() => {
    if (revealed) ratingRef.current?.focus();
  }, [revealed]);

  return (
    <article className="flashcard-session-card">
      <div className="flashcard-session-topline">
        <span>Tarjeta {position}</span>
        <span>{remaining} pendientes · {card.id}</span>
      </div>
      <div className="flashcard-session-meta">
        <span>{card.unitId}</span><span>{card.type}</span><span>{card.language.replace("_", " ↔ ")}</span>
        {exposure > 1 ? <span>Repetición {exposure}</span> : null}
      </div>

      <section className="flashcard-face" aria-live="polite" id="flashcard-answer">
        <span className="eyebrow">{revealed ? "Respuesta" : "Recuerda antes de revelar"}</span>
        <div className="flashcard-face-content"><FlashcardRichText text={revealed ? back : front} /></div>
      </section>

      {!revealed ? (
        <button
          aria-controls="flashcard-answer"
          aria-expanded={revealed}
          className="button primary flashcard-reveal-button"
          onClick={() => setRevealed(true)}
          type="button"
        >
          Mostrar respuesta
        </button>
      ) : (
        <fieldset className="flashcard-rating-panel" ref={ratingRef} tabIndex={-1}>
          <legend>¿Cómo fue tu recuerdo?</legend>
          <div className="flashcard-rating-actions">
            {(Object.keys(ratingCopy) as FlashcardRating[]).map((rating) => (
              <button className={`button flashcard-rating ${rating.toLowerCase()}`} key={rating} onClick={() => onRate(rating)} type="button">
                <strong>{ratingCopy[rating].label}</strong>
                <small>{ratingCopy[rating].help}</small>
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </article>
  );
}
