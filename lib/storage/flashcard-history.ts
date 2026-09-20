"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  makeInitialQueue,
  scheduleFlashcardRepeat,
} from "@/lib/flashcards/engine";
import type { Flashcard } from "@/types/flashcard";
import type {
  FlashcardAttempt,
  FlashcardHistorySnapshot,
  FlashcardRating,
  FlashcardSessionConfig,
  FlashcardStats,
  StoredFlashcardSession,
} from "@/types/flashcard-session";

const storageKey = "pp-flashcard-history-v1";
const changeEvent = "pp-flashcard-history-change";

const emptySnapshot: FlashcardHistorySnapshot = {
  schemaVersion: "FLASHCARD_HISTORY_V1",
  sessions: {},
  cardStats: {},
};

const emptySerialized = JSON.stringify(emptySnapshot);

function parseSnapshot(raw: string | null): FlashcardHistorySnapshot {
  if (!raw) return emptySnapshot;

  try {
    const parsed = JSON.parse(raw) as Partial<FlashcardHistorySnapshot>;

    if (
      parsed.schemaVersion !== "FLASHCARD_HISTORY_V1" ||
      typeof parsed.sessions !== "object" ||
      parsed.sessions === null ||
      typeof parsed.cardStats !== "object" ||
      parsed.cardStats === null
    ) {
      return emptySnapshot;
    }

    return {
      schemaVersion: "FLASHCARD_HISTORY_V1",
      sessions: parsed.sessions as Record<string, StoredFlashcardSession>,
      cardStats: parsed.cardStats as Record<string, FlashcardStats>,
    };
  } catch {
    return emptySnapshot;
  }
}

function getSnapshotRaw(): string {
  return window.localStorage.getItem(storageKey) ?? emptySerialized;
}

function getServerSnapshotRaw(): string {
  return emptySerialized;
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) listener();
  };

  const onLocalChange = () => listener();

  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onLocalChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onLocalChange);
  };
}

function writeSnapshot(snapshot: FlashcardHistorySnapshot) {
  window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
  window.dispatchEvent(new Event(changeEvent));
}

function readSnapshot(): FlashcardHistorySnapshot {
  return parseSnapshot(getSnapshotRaw());
}

export function useFlashcardHistory(): FlashcardHistorySnapshot {
  const raw = useSyncExternalStore(
    subscribe,
    getSnapshotRaw,
    getServerSnapshotRaw,
  );

  return useMemo(() => parseSnapshot(raw), [raw]);
}

export function createFlashcardSession({
  config,
  cards,
}: {
  config: FlashcardSessionConfig;
  cards: Flashcard[];
}) {
  const snapshot = readSnapshot();

  if (snapshot.sessions[config.sessionId]) {
    return;
  }

  snapshot.sessions[config.sessionId] = {
    ...config,
    startedAt: new Date().toISOString(),
    completedAt: null,
    queue: makeInitialQueue({
      cards,
      seed: config.seed,
      allowReverse: config.allowReverse,
    }),
    attempts: [],
  };

  writeSnapshot(snapshot);
}

export function recordFlashcardRating({
  sessionId,
  card,
  rating,
}: {
  sessionId: string;
  card: Flashcard;
  rating: FlashcardRating;
}) {
  const snapshot = readSnapshot();
  const session = snapshot.sessions[sessionId];

  if (!session || session.completedAt) {
    return;
  }

  const current = session.queue[0];
  if (!current || current.cardId !== card.id) {
    return;
  }

  const now = new Date().toISOString();
  const attempt: FlashcardAttempt = {
    cardId: card.id,
    conceptId: card.primaryConceptId,
    rating,
    direction: current.direction,
    exposure: current.exposure,
    ratedAt: now,
  };

  session.attempts.push(attempt);
  session.queue = scheduleFlashcardRepeat({
    remainingQueue: session.queue.slice(1),
    current,
    rating,
  });

  if (session.queue.length === 0) {
    session.completedAt = now;
  }

  snapshot.sessions[sessionId] = session;

  const previous = snapshot.cardStats[card.id] ?? {
    cardId: card.id,
    seen: 0,
    miss: 0,
    doubt: 0,
    know: 0,
    lastRating: null,
    lastSeenAt: null,
  };

  snapshot.cardStats[card.id] = {
    cardId: card.id,
    seen: previous.seen + 1,
    miss: previous.miss + (rating === "MISS" ? 1 : 0),
    doubt: previous.doubt + (rating === "DOUBT" ? 1 : 0),
    know: previous.know + (rating === "KNOW" ? 1 : 0),
    lastRating: rating,
    lastSeenAt: now,
  };

  writeSnapshot(snapshot);
}

export function resetFlashcardHistory() {
  writeSnapshot(emptySnapshot);
}
