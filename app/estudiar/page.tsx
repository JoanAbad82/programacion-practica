import Link from "next/link";
import { getBlockManifest, getBlockUnits } from "@/lib/content/study-content";
import type { BlockId } from "@/types/block";

const blockCopy: Record<BlockId, { slug: string; eyebrow: string; blurb: string }> = {
  B1: {
    slug: "b1",
    eyebrow: "Bloque 1 · Disponible",
    blurb:
      "Fundamentos y comandos básicos: la base de Python y PowerShell que sostiene todo lo demás.",
  },
  B2: {
    slug: "b2",
    eyebrow: "Bloque 2 · Disponible",
    blurb:
      "Automatización práctica con archivos y datos: scripts seguros, reutilizables y verificables.",
  },
};

export default async function StudyPage() {
  const [b1Manifest, b2Manifest, b1Units] = await Promise.all([
    getBlockManifest("B1"),
    getBlockManifest("B2"),
    getBlockUnits("B1"),
  ]);

  const blocks = [
    { id: "B1" as const, manifest: b1Manifest },
    { id: "B2" as const, manifest: b2Manifest },
  ];

  return (
    <section>
      <header className="page-header study-landing-header">
        <span className="eyebrow">Estudio · Contenido canónico</span>
        <h1>Aprender antes de memorizar.</h1>
        <p>
          Estudia los conceptos en orden, interpreta el código y utiliza después
          tests y tarjetas para consolidarlos. Los dos bloques comparten el
          mismo lector y el mismo modelo de progreso.
        </p>
      </header>

      <div className="study-block-grid">
        {blocks.map(({ id, manifest }) => {
          const copy = blockCopy[id];
          const objective =
            id === "B1" ? b1Units[0]?.objective : undefined;

          return (
            <Link
              className="study-block-card"
              href={`/estudiar/${copy.slug}`}
              key={id}
            >
              <div>
                <span className="eyebrow">{copy.eyebrow}</span>
                <h2>{manifest.title}</h2>
                <p>
                  {copy.blurb}
                  {objective ? ` ${objective}` : ""}
                </p>
              </div>
              <dl className="study-block-metrics">
                <div><dt>Unidades</dt><dd>{manifest.units}</dd></div>
                <div><dt>Conceptos</dt><dd>{manifest.concepts}</dd></div>
                <div><dt>Preguntas</dt><dd>{manifest.questions}</dd></div>
                <div><dt>Tarjetas</dt><dd>{manifest.flashcards}</dd></div>
              </dl>
              <span className="button primary">Abrir Bloque {id.slice(1)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
