"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  matchesFlashcardFilters,
  selectFlashcardIds,
} from "@/lib/flashcards/engine";
import {
  createFlashcardSession,
  useFlashcardHistory,
} from "@/lib/storage/flashcard-history";
import { masteryScoreMap } from "@/lib/progress/mastery";
import { useUnifiedProgress } from "@/lib/storage/unified-progress";
import type { Concept } from "@/types/content";
import type { Flashcard } from "@/types/flashcard";
import type { StudyUnitMeta } from "@/types/study";
import {
  FLASHCARD_SESSION_SIZES,
  type FlashcardFilters,
  type FlashcardLanguageFilter,
  type FlashcardMode,
  type FlashcardSessionSize,
  type FlashcardTypeFilter,
} from "@/types/flashcard-session";

const modeCopy: Record<FlashcardMode, { title: string; description: string }> = {
  MIXED: {
    title: "Mezcla",
    description: "Baraja de forma reproducible las tarjetas filtradas.",
  },
  ADAPTIVE: {
    title: "Adaptativo V1",
    description:
      "Prioriza menor dominio por concepto, tarjetas falladas, dudadas y no vistas.",
  },
};

const languageLabels: Record<FlashcardLanguageFilter, string> = {
  ALL: "Todos los lenguajes",
  COMMON: "Conceptos comunes",
  PYTHON: "Python",
  POWERSHELL: "PowerShell",
  PYTHON_POWERSHELL: "Python ↔ PowerShell",
};

const typeLabels: Record<FlashcardTypeFilter, string> = {
  ALL: "Todos los tipos",
  CD: "Concepto ↔ definición",
  CM: "Código ↔ significado",
  CR: "Código ↔ resultado",
  EC: "Error ↔ causa",
  PX: "Python ↔ PowerShell",
};

function makeSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `cards-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeSeed(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0];
  }

  return Math.floor(Math.random() * 4294967295);
}

export function FlashcardSetup({
  cards,
  units,
  initialMode = "MIXED",
  initialUnitId = null,
  concepts,
}: {
  cards: Flashcard[];
  units: StudyUnitMeta[];
  initialMode?: FlashcardMode;
  initialUnitId?: string | null;
  concepts: Concept[];
}) {
  const router = useRouter();
  const history = useFlashcardHistory();
  const progress = useUnifiedProgress({ concepts, units });
  const masteryByConcept = useMemo(() => masteryScoreMap(progress), [progress]);

  const [mode, setMode] = useState<FlashcardMode>(initialMode);
  const [size, setSize] = useState<FlashcardSessionSize>(10);
  const [unitId, setUnitId] = useState(initialUnitId ?? "ALL");
  const [language, setLanguage] =
    useState<FlashcardLanguageFilter>("ALL");
  const [cardType, setCardType] =
    useState<FlashcardTypeFilter>("ALL");
  const [allowReverse, setAllowReverse] = useState(true);
  const [message, setMessage] = useState("");

  const filters: FlashcardFilters = useMemo(
    () => ({
      unitId: unitId === "ALL" ? null : unitId,
      language,
      cardType,
    }),
    [unitId, language, cardType],
  );

  const pool = useMemo(
    () =>
      cards.filter((card) =>
        matchesFlashcardFilters(
          {
            id: card.id,
            unitId: card.unitId,
            primaryConceptId: card.primaryConceptId,
            type: card.type,
            language: card.language,
            reversible: card.reversible,
          },
          filters,
        ),
      ),
    [cards, filters],
  );

  const completedSessions = Object.values(history.sessions).filter(
    (session) => session.completedAt !== null,
  ).length;

  const totalSeen = Object.values(history.cardStats).reduce(
    (sum, stats) => sum + stats.seen,
    0,
  );

  const needsReview = Object.values(history.cardStats).filter(
    (stats) => stats.lastRating !== "KNOW",
  ).length;

  function startSession() {
    const effectiveSize = Math.min(size, pool.length);

    if (effectiveSize < 1) {
      setMessage("No hay tarjetas disponibles con estos filtros.");
      return;
    }

    const seed = makeSeed();
    const sessionId = makeSessionId();

    const cardIds = selectFlashcardIds({
      cards: cards.map((card) => ({
        id: card.id,
        unitId: card.unitId,
        primaryConceptId: card.primaryConceptId,
        type: card.type,
        language: card.language,
        reversible: card.reversible,
      })),
      mode,
      filters,
      history,
      size: effectiveSize,
      seed,
      masteryByConcept,
    });

    const selectedCards = cardIds
      .map((id) => cards.find((card) => card.id === id))
      .filter((card): card is Flashcard => Boolean(card));

    const config = {
      sessionId,
      seed,
      mode,
      requestedSize: size,
      cardIds,
      filters,
      allowReverse,
    };

    createFlashcardSession({ config, cards: selectedCards });

    const params = new URLSearchParams({
      sid: sessionId,
      seed: String(seed),
      mode: mode.toLowerCase(),
      size: String(size),
      ids: cardIds.join(","),
      reverse: allowReverse ? "1" : "0",
      language,
      type: cardType,
    });

    if (filters.unitId) {
      params.set("unit", filters.unitId);
    }

    router.push(`/tarjetas/sesion?${params.toString()}`);
  }

  return (
    <div className="flashcard-setup-layout">
      <section className="flashcard-setup-panel" aria-labelledby="configurar-tarjetas">
        <div>
          <span className="eyebrow">Recuperación activa</span>
          <h2 id="configurar-tarjetas">Configura la sesión</h2>
          <p>
            Las 80 tarjetas proceden directamente de
            `BLOCK1_FLASHCARD_BANK_V1.0`.
          </p>
        </div>

        <fieldset className="flashcard-mode-grid">
          <legend>Modo</legend>
          {(Object.keys(modeCopy) as FlashcardMode[]).map((candidate) => (
            <label className="flashcard-mode-option" key={candidate}>
              <input
                checked={mode === candidate}
                name="flashcard-mode"
                onChange={() => setMode(candidate)}
                type="radio"
              />
              <span>
                <strong>{modeCopy[candidate].title}</strong>
                <small>{modeCopy[candidate].description}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flashcard-filter-grid">
          <label>
            <span>Unidad</span>
            <select value={unitId} onChange={(event) => setUnitId(event.target.value)}>
              <option value="ALL">Todo el Bloque 1</option>
              {units.map((unit) => (
                <option key={unit.unitId} value={unit.unitId}>
                  {unit.unitId} — {unit.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Tamaño inicial</span>
            <select
              value={size}
              onChange={(event) =>
                setSize(Number(event.target.value) as FlashcardSessionSize)
              }
            >
              {FLASHCARD_SESSION_SIZES.map((value) => (
                <option key={value} value={value}>
                  {value} tarjetas
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Lenguaje</span>
            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as FlashcardLanguageFilter)
              }
            >
              {Object.entries(languageLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Tipo</span>
            <select
              value={cardType}
              onChange={(event) =>
                setCardType(event.target.value as FlashcardTypeFilter)
              }
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flashcard-reverse-option">
          <input
            checked={allowReverse}
            onChange={(event) => setAllowReverse(event.target.checked)}
            type="checkbox"
          />
          <span>
            <strong>Permitir dirección inversa cuando sea válida</strong>
            <small>
              Solo se invierten tarjetas marcadas como reversibles en el banco canónico.
            </small>
          </span>
        </label>

        <div className="flashcard-availability">
          <strong>{pool.length} tarjetas disponibles</strong>
          <span>La sesión inicial usará {Math.min(size, pool.length)}.</span>
        </div>

        {message ? <p className="flashcard-message" role="alert">{message}</p> : null}

        <button
          className="button primary"
          disabled={pool.length === 0}
          onClick={startSession}
          type="button"
        >
          Iniciar tarjetas
        </button>
      </section>

      <aside className="flashcard-history-panel">
        <span className="eyebrow">Historial local</span>
        <div className="flashcard-history-metrics">
          <div>
            <strong>{completedSessions}</strong>
            <span>sesiones completadas</span>
          </div>
          <div>
            <strong>{totalSeen}</strong>
            <span>exposiciones registradas</span>
          </div>
          <div>
            <strong>{needsReview}</strong>
            <span>tarjetas pendientes de consolidar</span>
          </div>
        </div>
        <p>
          `No la sabía` reaparece pronto; `Dudé`, más adelante;
          `La sabía` no se repite en la misma sesión.
        </p>
      </aside>
    </div>
  );
}
