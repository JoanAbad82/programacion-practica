import Link from "next/link";
import { BlockUnitList } from "@/components/study/block-unit-list";
import { BLOCK_LABELS, type BlockId } from "@/types/block";
import type { StudyUnitMeta } from "@/types/study";
import type { BlockManifest } from "@/lib/content/study-content";

const descriptions: Record<BlockId, string> = {
  B1: "Doce unidades ordenadas para construir una base práctica de programación con Python y PowerShell.",
  B2: "Doce unidades para automatizar con seguridad tareas de archivos, datos y scripts reutilizables en Python y PowerShell.",
};

export function BlockStudyIndex({
  blockId,
  manifest,
  units,
}: {
  blockId: BlockId;
  manifest: BlockManifest;
  units: StudyUnitMeta[];
}) {
  return (
    <section>
      <nav className="breadcrumbs" aria-label="Migas de pan">
        <Link href="/estudiar">Estudiar</Link>
        <span aria-hidden="true">/</span>
        <span>{BLOCK_LABELS[blockId]}</span>
      </nav>

      <header className="page-header block-study-header">
        <span className="eyebrow">{BLOCK_LABELS[blockId]} · {manifest.canonical_version}</span>
        <h1>{manifest.title}</h1>
        <p>{descriptions[blockId]}</p>
      </header>

      <BlockUnitList blockId={blockId} units={units} />
    </section>
  );
}
