"use client";

import { useEffect } from "react";
import {
  getUnitStudyStatus,
  markUnitStarted,
  markUnitStudied,
  useStudyProgress,
} from "@/lib/storage/unit-study-progress";

export function UnitProgressControls({ unitId }: { unitId: string }) {
  const snapshot = useStudyProgress();
  const status = getUnitStudyStatus(snapshot, unitId);

  useEffect(() => {
    markUnitStarted(unitId);
  }, [unitId]);

  return (
    <div className="unit-progress-controls">
      <span aria-live="polite" role="status">
        Estado: {status === "STUDIED" ? "Estudiada" : status === "IN_PROGRESS" ? "En curso" : "No iniciada"}
      </span>
      <button
        className="button"
        disabled={status === "STUDIED"}
        onClick={() => markUnitStudied(unitId)}
        type="button"
      >
        {status === "STUDIED" ? "Unidad estudiada" : "Marcar como estudiada"}
      </button>
    </div>
  );
}
