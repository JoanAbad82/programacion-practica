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
import { flashcardHistoryMetrics } from "@/lib/storage/history-metrics";
import { masteryScoreMap } from "@/lib/progress/mastery";
import { useClientSearchParams } from "@/lib/navigation/search-params";
import { useUnifiedProgress } from "@/lib/storage/unified-progress";
import { blockQueryValue, parseBlockParam } from "@/lib/content/session-params";
import { BLOCK_IDS, BLOCK_LABELS, type BlockId } from "@/types/block";
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

let fallbackSessionCounter = 0;

function makeSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  fallbackSessionCounter = (fallbackSessionCounter + 1) >>> 0;
  const perfPart =
    typeof performance !== "undefined"
      ? Math.floor(performance.now() * 1000) >>> 0
      : 0;
  return `cards-${Date.now().toString(36)}-${perfPart.toString(36)}-${fallbackSessionCounter.toString(36)}`;
}

function makeSeed(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0];
  }

  // This seed controls study ordering only; it is not a security token.
  // Modern browsers use crypto.getRandomValues above. Keep the compatibility
  // fallback variable without pretending it is cryptographically random.
  const timePart = Date.now() >>> 0;
  const perfPart =
    typeof performance !== "undefined"
      ? Math.floor(performance.now() * 1000) >>> 0
      : 0;
  return (timePart ^ perfPart ^ 0x9e3779b9) >>> 0;
}

function parseModeParam(value: string | null): FlashcardMode | null {
  switch (value?.toLowerCase()) {
    case "mixed":
      return "MIXED";
    case "adaptive":
      return "ADAPTIVE";
    default:
      return null;
  }
}

export function FlashcardSetup({
  blockLibraries,
  blockCounts,
}: {
  blockLibraries: Record<BlockId, {
    units: StudyUnitMeta[];
    cards: Flashcard[];
    concepts: Concept[];
  }>;
  blockCounts: Record<BlockId, { questions: number; flashcards: number }>;
}) {
  const router = useRouter();
  const searchParams = useClientSearchParams();
  const history = useFlashcardHistory();
  const requestedBlock = parseBlockParam(searchParams.get("block"), "B1");
  const [blockId, setBlockId] = useState<BlockId>(requestedBlock);

  const { units, cards, concepts } = blockLibraries[blockId];
  const progress = useUnifiedProgress({ concepts, units, blockId });
  const masteryByConcept = useMemo(() => masteryScoreMap(progress), [progress]);

  // `?mode=adaptive` and `?unit=uNN` arrive as query parameters on a statically
  // exported route and are derived during render instead of synced by effect.
  const requestedUnit =
    units.find(
      (unit) =>
        unit.unitId.toLowerCase() === searchParams.get("unit")?.toLowerCase(),
    )?.unitId ?? null;
  const requestedMode = parseModeParam(searchParams.get("mode"));

  const [modeOverride, setModeOverride] = useState<FlashcardMode | null>(null);
  const [unitOverride, setUnitOverride] = useState<string | null>(null);
  const [size, setSize] = useState<FlashcardSessionSize>(10);
  const [language, setLanguage] =
    useState<FlashcardLanguageFilter>("ALL");
  const [cardType, setCardType] =
    useState<FlashcardTypeFilter>("ALL");
  const [allowReverse, setAllowReverse] = useState(true);
  const [message, setMessage] = useState("");

  const mode: FlashcardMode = modeOverride ?? requestedMode ?? "MIXED";
  const unitId = unitOverride ?? requestedUnit ?? "ALL";

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

  // History metrics follow the selected block: sessions use their normalized
  // `blockId` (legacy entries default to B1) and card stats use the
  // block-unique card ids, so B1/B2 counts never mix.
  const { completedSessions, totalSeen, needsReview } = useMemo(
    () => flashcardHistoryMetrics(history, blockId),
    [history, blockId],
  );

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
      blockId,
      masteryByConcept,
    });

    const selectedCards = cardIds
      .map((id) => cards.find((card) => card.id === id))
      .filter((card): card is Flashcard => Boolean(card));

    const config = {
      sessionId,
      seed,
      blockId,
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
      block: blockQueryValue(blockId),
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
            Las {blockCounts[blockId].flashcards} tarjetas proceden directamente
            del banco canónico{" "}
            <code>{blockId === "B2" ? "BLOCK2_FLASHCARD_BANK_V1.0" : "BLOCK1_FLASHCARD_BANK_V1.0"}</code>.
          </p>
        </div>

        <fieldset className="block-selector">
          <legend>Bloque</legend>
          {BLOCK_IDS.map((candidate) => (
            <label className="block-selector-option" key={candidate}>
              <input
                checked={blockId === candidate}
                name="flashcard-block"
                onChange={() => {
                  setBlockId(candidate);
                  setModeOverride(null);
                  setUnitOverride(null);
                  setMessage("");
                  router.replace(`/tarjetas?block=${blockQueryValue(candidate)}`);
                }}
                type="radio"
                value={blockQueryValue(candidate)}
              />
              <span>
                <strong>{BLOCK_LABELS[candidate]}</strong>
                <small>{blockCounts[candidate].flashcards} tarjetas</small>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="flashcard-mode-grid">
          <legend>Modo</legend>
          {(Object.keys(modeCopy) as FlashcardMode[]).map((candidate) => (
            <label className="flashcard-mode-option" key={candidate}>
              <input
                checked={mode === candidate}
                name="flashcard-mode"
                onChange={() => setModeOverride(candidate)}
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
            <select
              value={unitId}
              onChange={(event) => setUnitOverride(event.target.value)}
            >
              <option value="ALL">Todo el {BLOCK_LABELS[blockId]}</option>
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
          <code>No la sabía</code> reaparece pronto; <code>Dudé</code>, más
          adelante; <code>La sabía</code> no se repite en la misma sesión.
        </p>
      </aside>
    </div>
  );
}
