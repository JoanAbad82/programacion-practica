"use client";

import Link from "next/link";
import { FlashcardSession } from "@/components/flashcards/flashcard-session";
import { flashcardsForBlock } from "@/lib/content/client-bank";
import { parseBlockParam } from "@/lib/content/session-params";
import { useClientSearchParams } from "@/lib/navigation/search-params";
import { blockIdFromContentId, type BlockId } from "@/types/block";
import type {
  FlashcardFilters,
  FlashcardLanguageFilter,
  FlashcardMode,
  FlashcardSessionConfig,
  FlashcardSessionSize,
  FlashcardTypeFilter,
} from "@/types/flashcard-session";

function parseMode(value: string | undefined): FlashcardMode | null {
  if (value === "mixed") return "MIXED";
  if (value === "adaptive") return "ADAPTIVE";
  return null;
}

function parseSize(value: string | undefined): FlashcardSessionSize | null {
  const parsed = Number(value);
  return parsed === 10 || parsed === 20 || parsed === 30 ? parsed : null;
}

function parseFilters(params: {
  unit?: string;
  language?: string;
  type?: string;
}): FlashcardFilters | null {
  const languages: FlashcardLanguageFilter[] = [
    "ALL",
    "COMMON",
    "PYTHON",
    "POWERSHELL",
    "PYTHON_POWERSHELL",
  ];
  const types: FlashcardTypeFilter[] = [
    "ALL",
    "CD",
    "CM",
    "CR",
    "EC",
    "PX",
  ];

  const language = languages.includes(
    params.language as FlashcardLanguageFilter,
  )
    ? (params.language as FlashcardLanguageFilter)
    : null;

  const cardType = types.includes(params.type as FlashcardTypeFilter)
    ? (params.type as FlashcardTypeFilter)
    : null;

  const unitId = params.unit?.toUpperCase() ?? null;

  if (
    !language ||
    !cardType ||
    (unitId !== null && !/^U(?:0[1-9]|1[0-2])$/.test(unitId))
  ) {
    return null;
  }

  return { unitId, language, cardType };
}

function resolveBlock(
  explicit: string | undefined,
  ids: string[],
): BlockId | null {
  const requested = parseBlockParam(explicit, "B1");
  const fromIds = ids.length > 0 ? blockIdFromContentId(ids[0]) : null;

  if (ids.length === 0) return requested;
  return fromIds === requested ? requested : null;
}

/**
 * Query-param flashcard session route. As with the quiz session route, the
 * exported HTML is the controlled invalid state and the browser rebuilds the
 * real session from `?sid=&seed=&block=&mode=&size=&ids=&reverse=`.
 */
export default function FlashcardSessionPage() {
  const searchParams = useClientSearchParams();
  const value = (key: string) => searchParams.get(key) ?? undefined;

  const sessionId = value("sid");
  const seedValue = Number(value("seed"));
  const mode = parseMode(value("mode"));
  const requestedSize = parseSize(value("size"));
  const allowReverse = value("reverse") === "1";
  const filters = parseFilters({
    unit: value("unit"),
    language: value("language"),
    type: value("type"),
  });
  const ids = (value("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const blockId = resolveBlock(value("block"), ids);
  const bank = blockId ? flashcardsForBlock(blockId) : [];
  const byId = new Map(bank.map((card) => [card.id, card]));
  const uniqueIds = new Set(ids);

  const valid =
    blockId !== null &&
    Boolean(sessionId) &&
    Number.isInteger(seedValue) &&
    seedValue >= 0 &&
    seedValue <= 4294967295 &&
    mode !== null &&
    requestedSize !== null &&
    filters !== null &&
    ids.length >= 1 &&
    ids.length <= 30 &&
    uniqueIds.size === ids.length &&
    ids.every((id) => byId.has(id));

  if (!valid || !blockId || !sessionId || !mode || !requestedSize || !filters) {
    return (
      <section className="flashcard-session-state">
        <span className="eyebrow">Sesión no válida</span>
        <h1>No se puede reconstruir este repaso.</h1>
        <Link className="button primary" href="/tarjetas">
          Volver a Tarjetas
        </Link>
      </section>
    );
  }

  const selectedCards = ids
    .map((id) => byId.get(id))
    .filter((card): card is NonNullable<typeof card> => Boolean(card));

  const config: FlashcardSessionConfig = {
    sessionId,
    seed: seedValue,
    blockId,
    mode,
    requestedSize,
    cardIds: ids,
    filters,
    allowReverse,
  };

  return <FlashcardSession cards={selectedCards} config={config} />;
}
