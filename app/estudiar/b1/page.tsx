import Link from "next/link";
import { BlockUnitList } from "@/components/study/block-unit-list";
import { getBlock1Manifest, getBlock1Units } from "@/lib/content/study-content";

export default async function Block1StudyPage() {
  const [manifest, units] = await Promise.all([
    getBlock1Manifest(),
    getBlock1Units(),
  ]);

  return (
    <section>
      <nav className="breadcrumbs" aria-label="Migas de pan">
        <Link href="/estudiar">Estudiar</Link>
        <span aria-hidden="true">/</span>
        <span>Bloque 1</span>
      </nav>

      <header className="page-header block-study-header">
        <span className="eyebrow">Bloque 1 · {manifest.canonical_version}</span>
        <h1>{manifest.title}</h1>
        <p>
          Doce unidades ordenadas para construir una base práctica de programación con Python y PowerShell.
        </p>
      </header>

      <BlockUnitList units={units} />
    </section>
  );
}
