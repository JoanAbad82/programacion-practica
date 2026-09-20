"use client";

import Link from "next/link";
import {
  getUnitStudyStatus,
  useStudyProgress,
} from "@/lib/storage/unit-study-progress";
import type { StudyUnitMeta, StudyUnitStatus } from "@/types/study";

const labels: Record<StudyUnitStatus, string> = {
  NOT_STARTED: "No iniciada",
  IN_PROGRESS: "En curso",
  STUDIED: "Estudiada",
};

export function BlockUnitList({ units }: { units: StudyUnitMeta[] }) {
  const progress = useStudyProgress();
  const studied = units.filter(
    (unit) => getUnitStudyStatus(progress, unit.unitId) === "STUDIED",
  ).length;
  const inProgress = units.filter(
    (unit) => getUnitStudyStatus(progress, unit.unitId) === "IN_PROGRESS",
  ).length;
  const completion = Math.round((studied / units.length) * 100);

  return (
    <section aria-labelledby="unidades-b1">
      <div className="study-progress-panel">
        <div>
          <span className="eyebrow">Progreso de estudio</span>
          <strong>{studied}/{units.length} unidades estudiadas</strong>
          <p>{inProgress > 0 ? `${inProgress} en curso` : "Ninguna unidad en curso"}</p>
        </div>
        <div
          className="study-progress-ring"
          aria-label={`${completion}% de unidades estudiadas`}
        >
          {completion}%
        </div>
      </div>

      <h2 id="unidades-b1">Unidades</h2>
      <div className="unit-list">
        {units.map((unit) => {
          const status = getUnitStudyStatus(progress, unit.unitId);

          return (
            <Link
              className="unit-card"
              href={`/estudiar/b1/${unit.unitId.toLowerCase()}`}
              key={unit.unitId}
            >
              <div className="unit-card-index">{String(unit.order).padStart(2, "0")}</div>
              <div className="unit-card-copy">
                <div className="unit-card-heading">
                  <strong>{unit.title}</strong>
                  <span className={`unit-status status-${status.toLowerCase()}`}>
                    {labels[status]}
                  </span>
                </div>
                <p>{unit.objective}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
