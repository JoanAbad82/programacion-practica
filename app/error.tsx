"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="system-state" aria-labelledby="error-aplicacion">
      <span className="eyebrow">Error inesperado</span>
      <h1 id="error-aplicacion">No hemos podido mostrar esta parte.</h1>
      <p>
        Tu progreso local no se borra por este error. Puedes volver a intentarlo
        o regresar al inicio.
      </p>
      <div className="actions">
        <button className="button primary" onClick={reset} type="button">
          Volver a intentar
        </button>
        <Link className="button" href="/">Ir al inicio</Link>
      </div>
    </section>
  );
}
