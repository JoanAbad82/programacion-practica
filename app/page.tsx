import Link from "next/link";
import { getBlockManifest } from "@/lib/content/study-content";

export default async function Home() {
  const [b1, b2] = await Promise.all([
    getBlockManifest("B1"),
    getBlockManifest("B2"),
  ]);

  const units = b1.units + b2.units;
  const questions = b1.questions + b2.questions;
  const flashcards = b1.flashcards + b2.flashcards;

  return (
    <>
      <section className="hero">
        <span className="eyebrow">
          Bloques 1 y 2 · Fundamentos y automatización práctica
        </span>
        <h1>Aprende a leer, entender y modificar código.</h1>
        <p>
          Estudia Python y PowerShell con contenido guiado en dos bloques,
          práctica objetiva, recuperación activa y progreso basado en conceptos.
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
            <p>{units} unidades canónicas en dos bloques para comprender la lógica antes de memorizar.</p>
            <span className="metric">{units}</span>
            <Link className="text-link" href="/estudiar">Abrir unidades →</Link>
          </article>
          <article className="card home-module-card">
            <strong>Tests</strong>
            <p>{questions} preguntas validadas para interpretar, aplicar y depurar.</p>
            <span className="metric">{questions}</span>
            <Link className="text-link" href="/tests">Configurar test →</Link>
          </article>
          <article className="card home-module-card">
            <strong>Tarjetas</strong>
            <p>{flashcards} flashcards para recuperación activa y repetición adaptativa.</p>
            <span className="metric">{flashcards}</span>
            <Link className="text-link" href="/tarjetas">Empezar repaso →</Link>
          </article>
        </div>
      </section>
    </>
  );
}
