import Link from "next/link";
import { getBlock1Manifest, getBlock1Units } from "@/lib/content/study-content";

export default async function StudyPage() {
  const [manifest, units] = await Promise.all([
    getBlock1Manifest(),
    getBlock1Units(),
  ]);

  return (
    <section>
      <header className="page-header study-landing-header">
        <span className="eyebrow">Estudio · Contenido canónico</span>
        <h1>Aprender antes de memorizar.</h1>
        <p>
          Estudia los conceptos en orden, interpreta el código y utiliza después tests y tarjetas para consolidarlos.
        </p>
      </header>

      <div className="study-block-grid">
        <Link className="study-block-card" href="/estudiar/b1">
          <div>
            <span className="eyebrow">Bloque 1 · Disponible</span>
            <h2>{manifest.title}</h2>
            <p>{units[0].objective} A partir de ahí, el bloque avanza hasta depuración y trabajo preciso con IA.</p>
          </div>
          <dl className="study-block-metrics">
            <div><dt>Unidades</dt><dd>{manifest.units}</dd></div>
            <div><dt>Conceptos</dt><dd>{manifest.concepts}</dd></div>
            <div><dt>Preguntas</dt><dd>{manifest.questions}</dd></div>
            <div><dt>Tarjetas</dt><dd>{manifest.flashcards}</dd></div>
          </dl>
          <span className="button primary">Abrir Bloque 1</span>
        </Link>
      </div>
    </section>
  );
}
