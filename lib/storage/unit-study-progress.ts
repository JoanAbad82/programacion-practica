"use client";

import { useSyncExternalStore } from "react";
import { studyUnitKey } from "@/types/block";
import type { BlockId } from "@/types/block";
import type {
  StudyProgressSnapshot,
  StudyUnitStatus,
  UnitStudyProgress,
} from "@/types/study";

/**
 * Study progress survives across blocks under the same `V1` storage key.
 *
 * Unit ids alone (`U01`) are not globally unique, so B2 progress is stored
 * under a block-namespaced key (`B1:U01` / `B2:U01`). Legacy B1-only snapshots
 * that used the bare `U01` key are normalized to `B1:U01` at read time, which
 * keeps existing browser-local data valid without clearing storage.
 */
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

function parseNamespaceKey(
  key: string,
): { blockId: BlockId; unitId: string } | null {
  const match = /^(B1|B2):(U\d+)$/.exec(key);
  return match
    ? { blockId: match[1] as BlockId, unitId: match[2] }
    : null;
}

function sanitizeSnapshot(value: unknown): StudyProgressSnapshot {
  if (!value || typeof value !== "object") return EMPTY_SNAPSHOT;

  const candidate = value as Partial<StudyProgressSnapshot>;
  const units: Record<string, UnitStudyProgress> = {};

  if (candidate.units && typeof candidate.units === "object") {
    for (const [rawKey, rawProgress] of Object.entries(candidate.units)) {
      if (!rawProgress || typeof rawProgress !== "object") continue;
      const progress = rawProgress as Partial<UnitStudyProgress>;
      if (!isStatus(progress.status)) continue;

      // New namespaced keys carry their block explicitly. Legacy bare unit ids
      // predate B2 and therefore always belong to Bloque 1.
      const namespaced = parseNamespaceKey(rawKey);
      const blockId: BlockId = namespaced
        ? namespaced.blockId
        : progress.blockId === "B2"
          ? "B2"
          : "B1";
      const unitId = namespaced
        ? namespaced.unitId
        : progress.unitId ?? rawKey;
      const key = studyUnitKey(blockId, unitId);

      units[key] = {
        blockId,
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
  blockId: BlockId,
  unitId: string,
): UnitStudyProgress | null {
  return snapshot.units[studyUnitKey(blockId, unitId)] ?? null;
}

export function useStudyProgress(): StudyProgressSnapshot {
  return useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);
}

export function getUnitStudyStatus(
  snapshot: StudyProgressSnapshot,
  unitId: string,
  blockId: BlockId = "B1",
): StudyUnitStatus {
  return currentUnitProgress(snapshot, blockId, unitId)?.status ?? "NOT_STARTED";
}

export function markUnitStarted(
  unitId: string,
  blockId: BlockId = "B1",
) {
  const snapshot = readSnapshot();
  const current = currentUnitProgress(snapshot, blockId, unitId);
  if (current?.status === "STUDIED" || current?.status === "IN_PROGRESS") return;

  const now = new Date().toISOString();
  writeSnapshot({
    schemaVersion: "STUDY_PROGRESS_V1",
    units: {
      ...snapshot.units,
      [studyUnitKey(blockId, unitId)]: {
        blockId,
        unitId,
        status: "IN_PROGRESS",
        startedAt: current?.startedAt ?? now,
        studiedAt: current?.studiedAt ?? null,
        updatedAt: now,
      },
    },
  });
}

export function markUnitStudied(
  unitId: string,
  blockId: BlockId = "B1",
) {
  const snapshot = readSnapshot();
  const current = currentUnitProgress(snapshot, blockId, unitId);
  const now = new Date().toISOString();

  writeSnapshot({
    schemaVersion: "STUDY_PROGRESS_V1",
    units: {
      ...snapshot.units,
      [studyUnitKey(blockId, unitId)]: {
        blockId,
        unitId,
        status: "STUDIED",
        startedAt: current?.startedAt ?? now,
        studiedAt: now,
        updatedAt: now,
      },
    },
  });
}
