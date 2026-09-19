import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="hero">
        <span className="eyebrow">Phase 1 · Bootstrap</span>
        <h1>Aprende a leer, entender y modificar código.</h1>
        <p>Una plataforma independiente para aprender Python y PowerShell con estudio guiado, tests, flashcards y progreso por conceptos.</p>
        <div className="actions">
          <Link className="button primary" href="/estudiar">Empezar a estudiar</Link>
          <Link className="button" href="/tests">Practicar con tests</Link>
        </div>
      </section>
      <section className="grid" aria-label="Módulos principales">
        <article className="card"><strong>Estudio</strong><p>12 unidades del Bloque 1 con contenido canónico versionado.</p><span className="metric">12</span></article>
        <article className="card"><strong>Tests</strong><p>Banco validado con preguntas orientadas a comprensión y aplicación.</p><span className="metric">200</span></article>
        <article className="card"><strong>Flashcards</strong><p>Recuperación activa sin convertir las tarjetas en una copia del test.</p><span className="metric">80</span></article>
      </section>
    </>
  );
}
