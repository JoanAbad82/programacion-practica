import Link from "next/link";

export default function Home() {
  return (
    <>
      <section className="hero">
        <span className="eyebrow">Bloque 1 · Fundamentos y comandos básicos</span>
        <h1>Aprende a leer, entender y modificar código.</h1>
        <p>
          Estudia Python y PowerShell con contenido guiado, práctica objetiva,
          recuperación activa y progreso basado en conceptos.
        </p>
        <div className="actions">
          <Link className="button primary" href="/estudiar">
            Continuar estudiando
          </Link>
          <Link className="button" href="/tests">
            Practicar con tests
          </Link>
        </div>
      </section>

      <section aria-labelledby="modulos-principales">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Tu recorrido</span>
            <h2 id="modulos-principales">Una misma base, tres formas de practicar</h2>
          </div>
        </div>
        <div className="grid home-module-grid">
          <article className="card home-module-card">
            <strong>Estudiar</strong>
            <p>12 unidades canónicas para comprender la lógica antes de memorizar.</p>
            <span className="metric">12</span>
            <Link className="text-link" href="/estudiar">Abrir unidades →</Link>
          </article>
          <article className="card home-module-card">
            <strong>Tests</strong>
            <p>200 preguntas validadas para interpretar, aplicar y depurar.</p>
            <span className="metric">200</span>
            <Link className="text-link" href="/tests">Configurar test →</Link>
          </article>
          <article className="card home-module-card">
            <strong>Tarjetas</strong>
            <p>80 flashcards para recuperación activa y repetición adaptativa.</p>
            <span className="metric">80</span>
            <Link className="text-link" href="/tarjetas">Empezar repaso →</Link>
          </article>
        </div>
      </section>
    </>
  );
}
