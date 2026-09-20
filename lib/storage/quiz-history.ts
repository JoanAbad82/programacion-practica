"use client";

import { useMemo, useSyncExternalStore } from "react";
import type {
  QuizAttempt,
  QuizHistorySnapshot,
  QuizSessionConfig,
  QuizQuestionStats,
  StoredQuizSession,
} from "@/types/quiz";

const storageKey = "pp-quiz-history-v1";
const changeEvent = "pp-quiz-history-change";
const emptySnapshot: QuizHistorySnapshot = {
  schemaVersion: "QUIZ_HISTORY_V1",
  sessions: {},
  questionStats: {},
};
const emptySerialized = JSON.stringify(emptySnapshot);

function parseSnapshot(raw: string | null): QuizHistorySnapshot {
  if (!raw) return emptySnapshot;

  try {
    const parsed = JSON.parse(raw) as Partial<QuizHistorySnapshot>;

    if (
      parsed.schemaVersion !== "QUIZ_HISTORY_V1" ||
      typeof parsed.sessions !== "object" ||
      parsed.sessions === null ||
      typeof parsed.questionStats !== "object" ||
      parsed.questionStats === null
    ) {
      return emptySnapshot;
    }

    return {
      schemaVersion: "QUIZ_HISTORY_V1",
      sessions: parsed.sessions as Record<string, StoredQuizSession>,
      questionStats: parsed.questionStats as Record<string, QuizQuestionStats>,
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
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) listener();
  };
  const handleLocalChange = () => listener();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(changeEvent, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(changeEvent, handleLocalChange);
  };
}

function writeSnapshot(snapshot: QuizHistorySnapshot) {
  window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
  window.dispatchEvent(new Event(changeEvent));
}

function readSnapshot(): QuizHistorySnapshot {
  return parseSnapshot(getSnapshotRaw());
}

export function useQuizHistory(): QuizHistorySnapshot {
  const raw = useSyncExternalStore(
    subscribe,
    getSnapshotRaw,
    getServerSnapshotRaw,
  );

  return useMemo(() => parseSnapshot(raw), [raw]);
}

export function createQuizSession(config: QuizSessionConfig) {
  const snapshot = readSnapshot();
  const existing = snapshot.sessions[config.sessionId];
  const now = new Date().toISOString();

  snapshot.sessions[config.sessionId] = existing ?? {
    ...config,
    startedAt: now,
    completedAt: null,
    attempts: [],
  };

  writeSnapshot(snapshot);
}

export function recordQuizAttempt({
  config,
  attempt,
  completed,
}: {
  config: QuizSessionConfig;
  attempt: QuizAttempt;
  completed: boolean;
}) {
  const snapshot = readSnapshot();
  const now = new Date().toISOString();
  const session = snapshot.sessions[config.sessionId] ?? {
    ...config,
    startedAt: now,
    completedAt: null,
    attempts: [],
  };

  if (session.attempts.some((item) => item.questionId === attempt.questionId)) {
    return;
  }

  session.attempts.push(attempt);
  session.completedAt = completed ? now : null;
  snapshot.sessions[config.sessionId] = session;

  const previous = snapshot.questionStats[attempt.questionId] ?? {
    questionId: attempt.questionId,
    attempts: 0,
    correct: 0,
    incorrect: 0,
    lastCorrect: null,
    lastAttemptAt: null,
  };

  snapshot.questionStats[attempt.questionId] = {
    questionId: attempt.questionId,
    attempts: previous.attempts + 1,
    correct: previous.correct + (attempt.correct ? 1 : 0),
    incorrect: previous.incorrect + (attempt.correct ? 0 : 1),
    lastCorrect: attempt.correct,
    lastAttemptAt: attempt.answeredAt,
  };

  writeSnapshot(snapshot);
}

export function resetQuizHistory() {
  writeSnapshot(emptySnapshot);
}
