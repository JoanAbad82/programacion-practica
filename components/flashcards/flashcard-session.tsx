"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlashcardPlayer } from "./flashcard-player";
import {
  recordFlashcardRating,
  useFlashcardHistory,
} from "@/lib/storage/flashcard-history";
import type { Flashcard } from "@/types/flashcard";
import type { FlashcardSessionConfig } from "@/types/flashcard-session";

export function FlashcardSession({
  config,
  cards,
}: {
  config: FlashcardSessionConfig;
  cards: Flashcard[];
}) {
  const router = useRouter();
  const history = useFlashcardHistory();
  const stored = history.sessions[config.sessionId];
  const cardMap = new Map(cards.map((card) => [card.id, card]));

  if (stored?.completedAt) {
    return (
      <section className="flashcard-session-state">
        <span className="eyebrow">Sesión completada</span>
        <h1>Este repaso ya está terminado.</h1>
        <Link
          className="button primary"
          href={`/tarjetas/resultados?sid=${encodeURIComponent(config.sessionId)}`}
        >
          Ver resultados
        </Link>
      </section>
    );
  }

  const current = stored?.queue[0];
  const card = current ? cardMap.get(current.cardId) : null;

  if (!stored || !current || !card) {
    return (
      <section className="flashcard-session-state">
        <span className="eyebrow">Sesión no disponible</span>
        <h1>No puedo recuperar la tarjeta actual.</h1>
        <Link className="button primary" href="/tarjetas">
          Volver a Tarjetas
        </Link>
      </section>
    );
  }

  const uniqueCardsSeen = new Set(stored.attempts.map((attempt) => attempt.cardId));
  const position = Math.min(
    config.cardIds.length,
    uniqueCardsSeen.size + 1,
  );

  return (
    <section className="flashcard-session-page">
      <header className="flashcard-session-header">
        <div>
          <span className="eyebrow">
            {config.mode === "ADAPTIVE" ? "Adaptativo V1" : "Mezcla"}
          </span>
          <p>
            Session ID: <code>{config.sessionId}</code> · Seed:{" "}
            <code>{config.seed}</code>
          </p>
        </div>
        <Link className="button" href="/tarjetas">Salir</Link>
      </header>

      <FlashcardPlayer
        card={card}
        direction={current.direction}
        exposure={current.exposure}
        key={`${config.sessionId}-${card.id}-${current.exposure}`}
        onRate={(rating) => {
          recordFlashcardRating({
            sessionId: config.sessionId,
            card,
            rating,
          });

          const final =
            stored.queue.length === 1 &&
            (rating === "KNOW" ||
              current.exposure >= (rating === "MISS" ? 3 : 2));

          if (final) {
            router.push(
              `/tarjetas/resultados?sid=${encodeURIComponent(config.sessionId)}`,
            );
          }
        }}
        position={position}
        remaining={stored.queue.length}
      />
    </section>
  );
}
