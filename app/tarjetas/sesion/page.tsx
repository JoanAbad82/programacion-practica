import Link from "next/link";
import { FlashcardSession } from "@/components/flashcards/flashcard-session";
import { getBlock1Flashcards } from "@/lib/content/flashcard-content";
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

export default async function FlashcardSessionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const sessionId = first(raw.sid);
  const seedValue = Number(first(raw.seed));
  const mode = parseMode(first(raw.mode));
  const requestedSize = parseSize(first(raw.size));
  const allowReverse = first(raw.reverse) === "1";
  const filters = parseFilters({
    unit: first(raw.unit),
    language: first(raw.language),
    type: first(raw.type),
  });
  const ids = (first(raw.ids) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const cards = await getBlock1Flashcards();
  const byId = new Map(cards.map((card) => [card.id, card]));
  const uniqueIds = new Set(ids);

  const valid =
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

  if (!valid || !sessionId || !mode || !requestedSize || !filters) {
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
    mode,
    requestedSize,
    cardIds: ids,
    filters,
    allowReverse,
  };

  return <FlashcardSession cards={selectedCards} config={config} />;
}
