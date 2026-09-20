import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  StudySection,
  StudyUnitDocument,
  StudyUnitMeta,
} from "@/types/study";

interface BlockManifest {
  block_id: string;
  title: string;
  canonical_version: string;
  concept_bank_version: string;
  test_bank_version: string;
  flashcard_bank_version: string;
  units: number;
  concepts: number;
  questions: number;
  flashcards: number;
}

const blockRoot = path.join(process.cwd(), "content", "block-1");
const canonicalRoot = path.join(blockRoot, "canonical");

export function normalizeUnitSlug(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return /^u(?:0[1-9]|1[0-2])$/.test(normalized) ? normalized : null;
}

function slugifyHeading(value: string): string {
  return value
    .replace(/`/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseStudyMarkdown(markdown: string): StudySection[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections: StudySection[] = [];

  let section: StudySection | null = null;
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let inCode = false;
  let codeLanguage = "text";
  let codeLines: string[] = [];

  const ensureSection = () => {
    if (!section) {
      section = { id: "contenido", title: "Contenido", blocks: [] };
      sections.push(section);
    }
    return section;
  };

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ").trim();
    if (text) ensureSection().blocks.push({ kind: "paragraph", text });
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    ensureSection().blocks.push({
      kind: "list",
      ordered: listOrdered,
      items: listItems,
    });
    listItems = [];
    listOrdered = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (inCode) {
      if (line.trim().startsWith("```")) {
        ensureSection().blocks.push({
          kind: "code",
          language: codeLanguage || "text",
          code: codeLines.join("\n"),
        });
        inCode = false;
        codeLanguage = "text";
        codeLines = [];
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    const fence = line.trim().match(/^```([a-zA-Z0-9_-]*)\s*$/);
    if (fence) {
      flushParagraph();
      flushList();
      inCode = true;
      codeLanguage = fence[1] || "text";
      continue;
    }

    const sectionHeading = line.match(/^##\s+(.+)$/);
    if (sectionHeading) {
      flushParagraph();
      flushList();
      section = {
        id: slugifyHeading(sectionHeading[1]),
        title: sectionHeading[1],
        blocks: [],
      };
      sections.push(section);
      continue;
    }

    if (/^#\s+/.test(line)) {
      flushParagraph();
      flushList();
      continue;
    }

    const unordered = line.match(/^\s*-\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listItems.length > 0 && listOrdered) flushList();
      listOrdered = false;
      listItems.push(unordered[1]);
      continue;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listItems.length > 0 && !listOrdered) flushList();
      listOrdered = true;
      listItems.push(ordered[1]);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      ensureSection().blocks.push({ kind: "quote", text: quote[1] });
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  if (inCode) {
    ensureSection().blocks.push({
      kind: "code",
      language: codeLanguage || "text",
      code: codeLines.join("\n"),
    });
  }

  return sections;
}

export async function getBlock1Manifest(): Promise<BlockManifest> {
  return JSON.parse(
    await readFile(path.join(blockRoot, "manifest.json"), "utf8"),
  ) as BlockManifest;
}

export async function getBlock1Units(): Promise<StudyUnitMeta[]> {
  const units = JSON.parse(
    await readFile(path.join(canonicalRoot, "units.json"), "utf8"),
  ) as StudyUnitMeta[];

  return [...units].sort((a, b) => a.order - b.order);
}

export async function getBlock1UnitBySlug(
  rawSlug: string,
): Promise<StudyUnitDocument | null> {
  const slug = normalizeUnitSlug(rawSlug);
  if (!slug) return null;

  const units = await getBlock1Units();
  const unit = units.find((candidate) => candidate.unitId.toLowerCase() === slug);
  if (!unit) return null;

  const markdown = await readFile(
    path.join(blockRoot, unit.canonicalFile),
    "utf8",
  );

  return {
    ...unit,
    slug,
    sections: parseStudyMarkdown(markdown),
  };
}

export async function getAdjacentUnits(rawSlug: string) {
  const slug = normalizeUnitSlug(rawSlug);
  if (!slug) return { previous: null, next: null };

  const units = await getBlock1Units();
  const index = units.findIndex((unit) => unit.unitId.toLowerCase() === slug);

  if (index < 0) return { previous: null, next: null };

  return {
    previous: index > 0 ? units[index - 1] : null,
    next: index < units.length - 1 ? units[index + 1] : null,
  };
}
