import type { Flashcard } from "@/types/flashcard";
import type {
  FlashcardDirection,
  FlashcardFilters,
  FlashcardHistorySnapshot,
  FlashcardMeta,
  FlashcardMode,
  FlashcardQueueItem,
  FlashcardRating,
} from "@/types/flashcard-session";

export function flashcardHashSeed(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function deterministicFlashcardShuffle<T>(
  values: readonly T[],
  seed: number,
): T[] {
  const output = [...values];
  const random = createRandom(seed);

  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }

  return output;
}

export function matchesFlashcardFilters(
  card: FlashcardMeta,
  filters: FlashcardFilters,
): boolean {
  const unitMatches = filters.unitId === null || card.unitId === filters.unitId;
  const languageMatches =
    filters.language === "ALL" || card.language === filters.language;
  const typeMatches = filters.cardType === "ALL" || card.type === filters.cardType;

  return unitMatches && languageMatches && typeMatches;
}

function adaptivePriority(
  card: FlashcardMeta,
  history: FlashcardHistorySnapshot,
  seed: number,
): number {
  const stats = history.cardStats[card.id];
  const tieBreak =
    (flashcardHashSeed(`${seed}:${card.id}:adaptive`) % 1000) / 10000;

  if (!stats) {
    return 60 + tieBreak;
  }

  const total = Math.max(1, stats.seen);
  const difficulty =
    (stats.miss * 3 + stats.doubt * 1.5) / total;

  const recencyWeight =
    stats.lastRating === "MISS"
      ? 120
      : stats.lastRating === "DOUBT"
        ? 90
        : 20;

  return recencyWeight + difficulty * 20 + tieBreak;
}

export function selectFlashcardIds({
  cards,
  mode,
  filters,
  history,
  size,
  seed,
}: {
  cards: FlashcardMeta[];
  mode: FlashcardMode;
  filters: FlashcardFilters;
  history: FlashcardHistorySnapshot;
  size: number;
  seed: number;
}): string[] {
  const pool = cards.filter((card) => matchesFlashcardFilters(card, filters));

  if (mode === "ADAPTIVE") {
    return [...pool]
      .sort(
        (a, b) =>
          adaptivePriority(b, history, seed) -
          adaptivePriority(a, history, seed),
      )
      .slice(0, size)
      .map((card) => card.id);
  }

  return deterministicFlashcardShuffle(
    pool,
    flashcardHashSeed(`${seed}:flashcards:mixed`),
  )
    .slice(0, size)
    .map((card) => card.id);
}

export function getFlashcardDirection({
  card,
  seed,
  allowReverse,
}: {
  card: Pick<Flashcard, "id" | "reversible">;
  seed: number;
  allowReverse: boolean;
}): FlashcardDirection {
  if (!allowReverse || !card.reversible) {
    return "FRONT_TO_BACK";
  }

  return flashcardHashSeed(`${seed}:${card.id}:direction`) % 2 === 0
    ? "FRONT_TO_BACK"
    : "BACK_TO_FRONT";
}

export function makeInitialQueue({
  cards,
  seed,
  allowReverse,
}: {
  cards: Flashcard[];
  seed: number;
  allowReverse: boolean;
}): FlashcardQueueItem[] {
  return cards.map((card) => ({
    cardId: card.id,
    direction: getFlashcardDirection({ card, seed, allowReverse }),
    exposure: 1,
  }));
}

export function scheduleFlashcardRepeat({
  remainingQueue,
  current,
  rating,
}: {
  remainingQueue: FlashcardQueueItem[];
  current: FlashcardQueueItem;
  rating: FlashcardRating;
}): FlashcardQueueItem[] {
  const queue = [...remainingQueue];

  const maxExposure =
    rating === "MISS" ? 3 : rating === "DOUBT" ? 2 : 1;

  if (current.exposure >= maxExposure || rating === "KNOW") {
    return queue;
  }

  const gap = rating === "MISS" ? 2 : 5;
  const insertionIndex = Math.min(gap, queue.length);

  queue.splice(insertionIndex, 0, {
    ...current,
    exposure: current.exposure + 1,
  });

  return queue;
}
