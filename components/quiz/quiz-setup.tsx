"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildQuestionPool,
  getErrorQuestionIds,
  selectQuestionIds,
} from "@/lib/quiz/engine";
import {
  createQuizSession,
  useQuizHistory,
} from "@/lib/storage/quiz-history";
import { masteryScoreMap } from "@/lib/progress/mastery";
import { useUnifiedProgress } from "@/lib/storage/unified-progress";
import type { Concept } from "@/types/content";
import type { Language } from "@/types/content";
import type { QuestionType } from "@/types/question";
import type { StudyUnitMeta } from "@/types/study";
import {
  QUIZ_SESSION_SIZES,
  type QuizDifficultyFilter,
  type QuizFilters,
  type QuizLanguageFilter,
  type QuizMode,
  type QuizQuestionMeta,
  type QuizSessionSize,
  type QuizTypeFilter,
} from "@/types/quiz";

const modeCopy: Record<QuizMode, { title: string; description: string }> = {
  BLOCK: {
    title: "Bloque completo",
    description: "Mezcla preguntas de las 12 unidades del Bloque 1.",
  },
  UNIT: {
    title: "Por unidad",
    description: "Practica únicamente una unidad concreta.",
  },
  ERRORS: {
    title: "Repasar errores",
    description: "Recupera preguntas cuya respuesta más reciente fue incorrecta.",
  },
  ADAPTIVE: {
    title: "Adaptativo V1",
    description: "Prioriza menor dominio por concepto, fallos recientes y preguntas aún no vistas.",
  },
};

const languageLabels: Record<QuizLanguageFilter, string> = {
  ALL: "Todos los lenguajes",
  COMMON: "Conceptos comunes",
  PYTHON: "Python",
  POWERSHELL: "PowerShell",
  PYTHON_POWERSHELL: "Python ↔ PowerShell",
};

const typeLabels: Record<QuizTypeFilter, string> = {
  ALL: "Todos los tipos",
  A: "A — Concepto",
  B: "B — Interpretación",
  C: "C — Resultado",
  D: "D — Código correcto",
  E: "E — Error / debugging",
  F: "F — Aplicación práctica",
};

function makeSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `quiz-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeSeed(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0];
  }

  return Math.floor(Math.random() * 4294967295);
}

export function QuizSetup({
  questions,
  units,
  initialUnitId,
  initialMode,
  concepts,
}: {
  questions: QuizQuestionMeta[];
  units: StudyUnitMeta[];
  initialUnitId: string | null;
  initialMode: QuizMode;
  concepts: Concept[];
}) {
  const router = useRouter();
  const history = useQuizHistory();
  const progress = useUnifiedProgress({ concepts, units });
  const masteryByConcept = useMemo(() => masteryScoreMap(progress), [progress]);

  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [unitId, setUnitId] = useState(
    initialUnitId ?? units[0]?.unitId ?? "U01",
  );
  const [size, setSize] = useState<QuizSessionSize>(10);
  const [language, setLanguage] = useState<QuizLanguageFilter>("ALL");
  const [difficulty, setDifficulty] =
    useState<QuizDifficultyFilter>("ALL");
  const [questionType, setQuestionType] =
    useState<QuizTypeFilter>("ALL");
  const [message, setMessage] = useState("");

  const filters: QuizFilters = useMemo(
    () => ({ language, difficulty, questionType }),
    [language, difficulty, questionType],
  );

  const pool = useMemo(
    () =>
      buildQuestionPool({
        questions,
        mode,
        unitId: mode === "UNIT" ? unitId : null,
        filters,
        history,
      }),
    [questions, mode, unitId, filters, history],
  );

  const errorCount = useMemo(
    () => getErrorQuestionIds(history).length,
    [history],
  );

  const completedSessions = Object.values(history.sessions).filter(
    (session) => session.completedAt !== null,
  ).length;
  const totalAttempts = Object.values(history.questionStats).reduce(
    (sum, stats) => sum + stats.attempts,
    0,
  );

  function startSession() {
    const seed = makeSeed();
    const sessionId = makeSessionId();
    const effectiveSize = Math.min(size, pool.length);

    if (effectiveSize < 1) {
      setMessage(
        mode === "ERRORS"
          ? "Todavía no hay errores disponibles con estos filtros."
          : "No hay preguntas disponibles con esta combinación de filtros.",
      );
      return;
    }

    const questionIds = selectQuestionIds({
      questions,
      mode,
      unitId: mode === "UNIT" ? unitId : null,
      filters,
      history,
      size: effectiveSize,
      seed,
      masteryByConcept,
    });

    const config = {
      sessionId,
      seed,
      mode,
      unitId: mode === "UNIT" ? unitId : null,
      requestedSize: size,
      questionIds,
      filters,
    };

    createQuizSession(config);

    const params = new URLSearchParams({
      sid: sessionId,
      seed: String(seed),
      mode: mode.toLowerCase(),
      size: String(size),
      ids: questionIds.join(","),
      language: String(language),
      difficulty: String(difficulty),
      type: String(questionType),
    });

    if (mode === "UNIT") params.set("unit", unitId);

    router.push(`/tests/sesion?${params.toString()}`);
  }

  return (
    <div className="quiz-setup-layout">
      <section className="quiz-setup-panel" aria-labelledby="configurar-test">
        <div>
          <span className="eyebrow">Motor de práctica</span>
          <h2 id="configurar-test">Configura la sesión</h2>
          <p>
            Las preguntas proceden directamente del banco canónico{" "}
            <code>BLOCK1_TEST_BANK_V1.0</code>. La selección y el orden se fijan
            mediante una semilla reproducible.
          </p>
        </div>

        <fieldset className="quiz-mode-grid">
          <legend>Modo</legend>
          {(Object.keys(modeCopy) as QuizMode[]).map((candidate) => (
            <label className="quiz-mode-option" key={candidate}>
              <input
                checked={mode === candidate}
                name="quiz-mode"
                onChange={() => {
                  setMode(candidate);
                  setMessage("");
                }}
                type="radio"
              />
              <span>
                <strong>{modeCopy[candidate].title}</strong>
                <small>{modeCopy[candidate].description}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="quiz-filter-grid">
          {mode === "UNIT" ? (
            <label>
              <span>Unidad</span>
              <select
                value={unitId}
                onChange={(event) => setUnitId(event.target.value)}
              >
                {units.map((unit) => (
                  <option key={unit.unitId} value={unit.unitId}>
                    {unit.unitId} — {unit.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label>
            <span>Tamaño</span>
            <select
              value={size}
              onChange={(event) =>
                setSize(Number(event.target.value) as QuizSessionSize)
              }
            >
              {QUIZ_SESSION_SIZES.map((value) => (
                <option key={value} value={value}>
                  {value} preguntas
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Lenguaje</span>
            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as Language | "ALL")
              }
            >
              {Object.entries(languageLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Dificultad</span>
            <select
              value={difficulty}
              onChange={(event) => {
                const value = event.target.value;
                setDifficulty(
                  value === "ALL"
                    ? "ALL"
                    : (Number(value) as 1 | 2 | 3),
                );
              }}
            >
              <option value="ALL">Todas</option>
              <option value="1">Nivel 1</option>
              <option value="2">Nivel 2</option>
              <option value="3">Nivel 3</option>
            </select>
          </label>

          <label>
            <span>Tipo</span>
            <select
              value={questionType}
              onChange={(event) =>
                setQuestionType(event.target.value as QuestionType | "ALL")
              }
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="quiz-availability">
          <strong>{pool.length} preguntas disponibles</strong>
          <span>
            La sesión usará {Math.min(size, pool.length)}.
            {mode === "ERRORS" ? ` Errores activos: ${errorCount}.` : ""}
          </span>
        </div>

        {message ? <p className="quiz-message" role="alert">{message}</p> : null}

        <button
          className="button primary"
          disabled={pool.length === 0}
          onClick={startSession}
          type="button"
        >
          Iniciar test
        </button>
      </section>

      <aside className="quiz-history-panel">
        <span className="eyebrow">Historial local</span>
        <div className="quiz-history-metrics">
          <div>
            <strong>{completedSessions}</strong>
            <span>sesiones completadas</span>
          </div>
          <div>
            <strong>{totalAttempts}</strong>
            <span>respuestas registradas</span>
          </div>
          <div>
            <strong>{errorCount}</strong>
            <span>errores para repasar</span>
          </div>
        </div>
        <p>
          El historial permanece en este navegador. No se envía a ningún
          servicio externo.
        </p>
      </aside>
    </div>
  );
}
