"use client";

import { useState } from "react";

const learningKeys = [
  "pp-study-progress-v1",
  "pp-quiz-history-v1",
  "pp-flashcard-history-v1",
] as const;

const changeEvents = [
  "pp-study-progress-change",
  "pp-quiz-history-change",
  "pp-flashcard-history-change",
] as const;

export function LocalDataControls() {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  function clearLearningData() {
    for (const key of learningKeys) window.localStorage.removeItem(key);
    for (const eventName of changeEvents) {
      window.dispatchEvent(new Event(eventName));
    }
    setConfirming(false);
    setMessage("El progreso local se ha borrado. La preferencia de tema se conserva.");
  }

  return (
    <section className="settings-card" aria-labelledby="datos-locales">
      <div>
        <span className="eyebrow">Datos locales</span>
        <h2 id="datos-locales">Progreso del navegador</h2>
        <p>
          Estudio, tests y tarjetas se guardan únicamente en este navegador.
          Borrar estos datos no modifica el contenido del curso ni el tema visual.
        </p>
      </div>

      {!confirming ? (
        <button
          className="button danger-outline"
          onClick={() => {
            setConfirming(true);
            setMessage("");
          }}
          type="button"
        >
          Borrar progreso local
        </button>
      ) : (
        <div className="confirmation-panel" role="group" aria-label="Confirmar borrado del progreso">
          <p><strong>Esta acción no se puede deshacer.</strong></p>
          <div className="actions">
            <button className="button danger" onClick={clearLearningData} type="button">
              Sí, borrar progreso
            </button>
            <button className="button" onClick={() => setConfirming(false)} type="button">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {message ? <p className="status-message" role="status">{message}</p> : null}
    </section>
  );
}
