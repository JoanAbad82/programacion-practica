"use client";

import { useSyncExternalStore } from "react";
import type {
  StudyProgressSnapshot,
  StudyUnitStatus,
  UnitStudyProgress,
} from "@/types/study";

const STORAGE_KEY = "pp-study-progress-v1";
const CHANGE_EVENT = "pp-study-progress-change";

const EMPTY_SNAPSHOT: StudyProgressSnapshot = {
  schemaVersion: "STUDY_PROGRESS_V1",
  units: {},
};

let cachedRaw: string | null | undefined;
let cachedSnapshot: StudyProgressSnapshot = EMPTY_SNAPSHOT;

function isStatus(value: unknown): value is StudyUnitStatus {
  return value === "NOT_STARTED" || value === "IN_PROGRESS" || value === "STUDIED";
}

function sanitizeSnapshot(value: unknown): StudyProgressSnapshot {
  if (!value || typeof value !== "object") return EMPTY_SNAPSHOT;

  const candidate = value as Partial<StudyProgressSnapshot>;
  const units: Record<string, UnitStudyProgress> = {};

  if (candidate.units && typeof candidate.units === "object") {
    for (const [unitId, rawProgress] of Object.entries(candidate.units)) {
      if (!rawProgress || typeof rawProgress !== "object") continue;
      const progress = rawProgress as Partial<UnitStudyProgress>;
      if (!isStatus(progress.status)) continue;

      units[unitId] = {
        unitId,
        status: progress.status,
        startedAt: typeof progress.startedAt === "string" ? progress.startedAt : null,
        studiedAt: typeof progress.studiedAt === "string" ? progress.studiedAt : null,
        updatedAt:
          typeof progress.updatedAt === "string"
            ? progress.updatedAt
            : new Date(0).toISOString(),
      };
    }
  }

  return {
    schemaVersion: "STUDY_PROGRESS_V1",
    units,
  };
}

function readSnapshot(): StudyProgressSnapshot {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;

  cachedRaw = raw;

  if (!raw) {
    cachedSnapshot = EMPTY_SNAPSHOT;
    return cachedSnapshot;
  }

  try {
    cachedSnapshot = sanitizeSnapshot(JSON.parse(raw));
  } catch {
    cachedSnapshot = EMPTY_SNAPSHOT;
  }

  return cachedSnapshot;
}

function getServerSnapshot(): StudyProgressSnapshot {
  return EMPTY_SNAPSHOT;
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cachedRaw = undefined;
    listener();
  };

  const onLocalChange = () => {
    cachedRaw = undefined;
    listener();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onLocalChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onLocalChange);
  };
}

function writeSnapshot(snapshot: StudyProgressSnapshot) {
  const raw = JSON.stringify(snapshot);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = snapshot;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function currentUnitProgress(
  snapshot: StudyProgressSnapshot,
  unitId: string,
): UnitStudyProgress | null {
  return snapshot.units[unitId] ?? null;
}

export function useStudyProgress(): StudyProgressSnapshot {
  return useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);
}

export function getUnitStudyStatus(
  snapshot: StudyProgressSnapshot,
  unitId: string,
): StudyUnitStatus {
  return currentUnitProgress(snapshot, unitId)?.status ?? "NOT_STARTED";
}

export function markUnitStarted(unitId: string) {
  const snapshot = readSnapshot();
  const current = currentUnitProgress(snapshot, unitId);
  if (current?.status === "STUDIED" || current?.status === "IN_PROGRESS") return;

  const now = new Date().toISOString();
  writeSnapshot({
    schemaVersion: "STUDY_PROGRESS_V1",
    units: {
      ...snapshot.units,
      [unitId]: {
        unitId,
        status: "IN_PROGRESS",
        startedAt: current?.startedAt ?? now,
        studiedAt: current?.studiedAt ?? null,
        updatedAt: now,
      },
    },
  });
}

export function markUnitStudied(unitId: string) {
  const snapshot = readSnapshot();
  const current = currentUnitProgress(snapshot, unitId);
  const now = new Date().toISOString();

  writeSnapshot({
    schemaVersion: "STUDY_PROGRESS_V1",
    units: {
      ...snapshot.units,
      [unitId]: {
        unitId,
        status: "STUDIED",
        startedAt: current?.startedAt ?? now,
        studiedAt: now,
        updatedAt: now,
      },
    },
  });
}
