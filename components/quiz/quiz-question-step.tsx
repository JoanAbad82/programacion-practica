"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QuizRichText } from "./quiz-rich-text";
import { shuffleQuestionOptions } from "@/lib/quiz/engine";
import type { Question } from "@/types/question";
import type { QuizAttempt } from "@/types/quiz";

const typeLabels = {
  A: "Concepto",
  B: "Interpretación",
  C: "Resultado",
  D: "Código correcto",
  E: "Error / debugging",
  F: "Aplicación práctica",
} as const;

export function QuizQuestionStep({ question, seed, index, total, onContinue }: {
  question: Question;
  seed: number;
  index: number;
  total: number;
  onContinue: (attempt: QuizAttempt) => void;
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const feedbackRef = useRef<HTMLElement>(null);

  const options = useMemo(
    () => shuffleQuestionOptions(question.options, seed, question.id),
    [question, seed],
  );

  const selectedOption = options.find((option) => option.id === selectedOptionId);
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);
  const isCorrect = answered && selectedOptionId === question.correctOptionId;

  useEffect(() => {
    if (answered) feedbackRef.current?.focus();
  }, [answered]);

  function submitAnswer() {
    if (!selectedOptionId) return;
    setAnswered(true);
  }

  function continueSession() {
    if (!answered || !selectedOptionId) return;
    onContinue({
      questionId: question.id,
      unitId: question.unitId,
      conceptId: question.primaryConceptId,
      difficulty: question.difficulty,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      correct: selectedOptionId === question.correctOptionId,
      answeredAt: new Date().toISOString(),
    });
  }

  return (
    <article className="quiz-question-card">
      <div className="quiz-question-topline">
        <span>Pregunta {index + 1} de {total}</span>
        <span>{question.id}</span>
      </div>

      <div
        aria-label={`Progreso: ${index + 1} de ${total} preguntas`}
        aria-valuemax={total}
        aria-valuemin={1}
        aria-valuenow={index + 1}
        className="quiz-progress-track"
        role="progressbar"
      >
        <span className="quiz-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      <div className="quiz-question-meta">
        <span>Nivel {question.difficulty}</span>
        <span>{typeLabels[question.type]}</span>
        <span>{question.language.replace("_", " ↔ ")}</span>
      </div>

      <h1 className="quiz-question-prompt"><QuizRichText text={question.prompt} /></h1>

      <fieldset className="quiz-options">
        <legend className="sr-only">Selecciona una respuesta</legend>
        {options.map((option) => {
          const selected = option.id === selectedOptionId;
          const correct = option.id === question.correctOptionId;
          const stateClass = answered
            ? correct ? "is-correct" : selected ? "is-wrong" : ""
            : selected ? "is-selected" : "";

          return (
            <label className={`quiz-option ${stateClass}`} key={option.id}>
              <input
                checked={selected}
                disabled={answered}
                name={`answer-${question.id}`}
                onChange={() => setSelectedOptionId(option.id)}
                type="radio"
                value={option.id}
              />
              <span className="quiz-option-marker" aria-hidden="true" />
              <QuizRichText compact text={option.text} />
              {answered && correct ? <span className="option-state-text">Correcta</span> : null}
              {answered && selected && !correct ? <span className="option-state-text">Tu elección</span> : null}
            </label>
          );
        })}
      </fieldset>

      {!answered ? (
        <button className="button primary" disabled={!selectedOptionId} onClick={submitAnswer} type="button">
          Responder
        </button>
      ) : (
        <section
          aria-live="polite"
          className={`quiz-feedback ${isCorrect ? "correct" : "incorrect"}`}
          ref={feedbackRef}
          tabIndex={-1}
        >
          <strong>{isCorrect ? "Respuesta correcta" : "Respuesta incorrecta"}</strong>
          {!isCorrect && correctOption ? <p>Respuesta correcta: <QuizRichText compact text={correctOption.text} /></p> : null}
          {selectedOption ? <p className="quiz-feedback-selection">Tu respuesta: <QuizRichText compact text={selectedOption.text} /></p> : null}
          <div className="quiz-explanation">
            <span className="eyebrow">Explicación</span>
            <p><QuizRichText text={question.explanation} /></p>
          </div>
          <button className="button primary" onClick={continueSession} type="button">
            {index + 1 === total ? "Ver resultados" : "Siguiente"}
          </button>
        </section>
      )}
    </article>
  );
}
