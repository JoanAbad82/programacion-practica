"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useUnifiedProgress } from "@/lib/storage/unified-progress";
import type { Concept } from "@/types/content";
import type { ConceptProgress, MasteryState } from "@/types/progress";
import type { StudyUnitMeta } from "@/types/study";

const stateLabels: Record<MasteryState, string> = {
  NEW: "Nuevo",
  LEARNING: "En aprendizaje",
  UNDERSTOOD: "Comprendido",
  MASTERED: "Dominado",
};

const priorityRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 } as const;

function attentionRank(item: ConceptProgress): number {
  if (item.masteryState === "LEARNING") return 0;
  if (item.masteryState === "NEW") return 1;
  if (item.masteryState === "UNDERSTOOD") return 2;
  return 3;
}

export function ProgressDashboard({
  concepts,
  units,
}: {
  concepts: Concept[];
  units: StudyUnitMeta[];
}) {
  const model = useUnifiedProgress({ concepts, units });
  const block = model.block;

  const attention = useMemo(
    () =>
      Object.values(model.concepts)
        .filter((item) => item.masteryState !== "MASTERED")
        .sort((a, b) => {
          const byState = attentionRank(a) - attentionRank(b);
          if (byState !== 0) return byState;
          const byScore = a.masteryScore - b.masteryScore;
          if (byScore !== 0) return byScore;
          return priorityRank[a.priority] - priorityRank[b.priority];
        })
        .slice(0, 8),
    [model.concepts],
  );

  const strong = useMemo(
    () =>
      Object.values(model.concepts)
        .filter((item) =>
          item.masteryState === "MASTERED" || item.masteryState === "UNDERSTOOD",
        )
        .sort((a, b) => b.masteryScore - a.masteryScore)
        .slice(0, 6),
    [model.concepts],
  );

  return (
    <div className="progress-dashboard">
      <section className="progress-hero-grid" aria-label="Resumen global">
        <article className="progress-hero-card primary-metric">
          <span>Dominio medio</span>
          <strong>{block.masteryScore}%</strong>
          <small>{block.coveragePercent}% de conceptos ya tienen evidencia</small>
        </article>
        <article className="progress-hero-card">
          <span>Dominados</span>
          <strong>{block.stateCounts.mastered}/{block.conceptCount}</strong>
          <small>{block.stateCounts.understood} comprendidos</small>
        </article>
        <article className="progress-hero-card">
          <span>Tests</span>
          <strong>{block.activity.quizAccuracy}%</strong>
          <small>{block.activity.quizCorrect}/{block.activity.quizAttempts} correctas</small>
        </article>
        <article className="progress-hero-card">
          <span>Estudio</span>
          <strong>{block.activity.studiedUnits}/12</strong>
          <small>{block.activity.inProgressUnits} unidades en curso</small>
        </article>
      </section>

      <section className="progress-state-panel" aria-labelledby="estados-dominio">
        <div>
          <span className="eyebrow">Estados de dominio</span>
          <h2 id="estados-dominio">56 conceptos, una señal común</h2>
        </div>
        <div className="progress-state-grid">
          <div><strong>{block.stateCounts.new}</strong><span>Nuevo</span></div>
          <div><strong>{block.stateCounts.learning}</strong><span>En aprendizaje</span></div>
          <div><strong>{block.stateCounts.understood}</strong><span>Comprendido</span></div>
          <div><strong>{block.stateCounts.mastered}</strong><span>Dominado</span></div>
        </div>
      </section>

      <section className="progress-unit-section" aria-labelledby="progreso-unidades">
        <div className="progress-section-heading">
          <div>
            <span className="eyebrow">Por unidad</span>
            <h2 id="progreso-unidades">Bloque 1</h2>
          </div>
          <p>El porcentaje de dominio agrega los conceptos de cada unidad.</p>
        </div>

        <div className="progress-unit-grid">
          {units.map((unit) => {
            const summary = model.units[unit.unitId];
            return (
              <article className="progress-unit-card" key={unit.unitId}>
                <div className="progress-unit-heading">
                  <span>{unit.unitId}</span>
                  <strong>{summary.masteryScore}%</strong>
                </div>
                <h3>{unit.title}</h3>
                <div
                  aria-label={`${summary.masteryScore}% de dominio`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={summary.masteryScore}
                  className="mastery-track"
                  role="progressbar"
                >
                  <span style={{ width: `${summary.masteryScore}%` }} />
                </div>
                <p>
                  {summary.stateCounts.mastered} dominados · {summary.stateCounts.understood} comprendidos · {summary.stateCounts.learning} aprendiendo · {summary.stateCounts.new} nuevos
                </p>
                <p className="progress-unit-meta">
                  Cobertura {summary.coveragePercent}% · Estudio {summary.studyStatus === "STUDIED" ? "completado" : summary.studyStatus === "IN_PROGRESS" ? "en curso" : "sin iniciar"}
                </p>
                <div className="progress-unit-actions">
                  <Link href={`/estudiar/b1/${unit.unitId.toLowerCase()}`}>Estudiar</Link>
                  <Link href={`/tests?unit=${unit.unitId.toLowerCase()}`}>Test</Link>
                  <Link href={`/tarjetas?unit=${unit.unitId}`}>Tarjetas</Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="progress-focus-grid">
        <section className="progress-focus-panel" aria-labelledby="foco-refuerzo">
          <div>
            <span className="eyebrow">Siguiente foco</span>
            <h2 id="foco-refuerzo">Conceptos a reforzar</h2>
          </div>
          <div className="progress-concept-list">
            {attention.map((item) => (
              <Link
                className="progress-concept-row"
                href={`/tests?unit=${item.unitId.toLowerCase()}`}
                key={item.conceptId}
              >
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.unitId} · {stateLabels[item.masteryState]} · {item.interactions} evidencias</small>
                </span>
                <b>{item.masteryScore}%</b>
              </Link>
            ))}
          </div>
        </section>

        <section className="progress-focus-panel" aria-labelledby="foco-fuerte">
          <div>
            <span className="eyebrow">Consolidado</span>
            <h2 id="foco-fuerte">Conceptos más fuertes</h2>
          </div>
          {strong.length > 0 ? (
            <div className="progress-concept-list">
              {strong.map((item) => (
                <div className="progress-concept-row passive" key={item.conceptId}>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.unitId} · {stateLabels[item.masteryState]}</small>
                  </span>
                  <b>{item.masteryScore}%</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="progress-empty-copy">
              Todavía no hay conceptos comprendidos o dominados. Aparecerán aquí a medida que acumules evidencia.
            </p>
          )}
        </section>
      </div>

      <section className="progress-method-panel">
        <span className="eyebrow">Cómo se calcula</span>
        <h2>Dominio basado en evidencia reciente</h2>
        <p>
          Se utilizan como máximo las 12 evidencias más recientes de cada concepto. Los tests pesan más que las flashcards; estudiar una unidad aporta una señal débil. Un fallo reciente puede hacer bajar el estado.
        </p>
        <div className="progress-method-grid">
          <div><strong>COMPRENDIDO</strong><span>≥70%, 4 evidencias y al menos 2 respuestas de test.</span></div>
          <div><strong>DOMINADO</strong><span>≥85%, 6 evidencias, 3 respuestas de test y sin fallo significativo reciente.</span></div>
        </div>
      </section>
    </div>
  );
}
