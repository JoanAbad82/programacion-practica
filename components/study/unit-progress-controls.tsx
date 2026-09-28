"use client";

import { useEffect } from "react";
import {
  getUnitStudyStatus,
  markUnitStarted,
  markUnitStudied,
  useStudyProgress,
} from "@/lib/storage/unit-study-progress";
import type { BlockId } from "@/types/block";

export function UnitProgressControls({
  unitId,
  blockId = "B1",
}: {
  unitId: string;
  blockId?: BlockId;
}) {
  const snapshot = useStudyProgress();
  const status = getUnitStudyStatus(snapshot, unitId, blockId);

  useEffect(() => {
    markUnitStarted(unitId, blockId);
  }, [unitId, blockId]);

  return (
    <div className="unit-progress-controls">
      <span aria-live="polite" role="status">
        Estado: {status === "STUDIED" ? "Estudiada" : status === "IN_PROGRESS" ? "En curso" : "No iniciada"}
      </span>
      <button
        className="button"
        disabled={status === "STUDIED"}
        onClick={() => markUnitStudied(unitId, blockId)}
        type="button"
      >
        {status === "STUDIED" ? "Unidad estudiada" : "Marcar como estudiada"}
      </button>
    </div>
  );
}
