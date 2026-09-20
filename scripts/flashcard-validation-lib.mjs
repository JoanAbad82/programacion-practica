import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const flashcardRoot = path.join(root, "content", "block-1", "flashcards");

export function hashSeed(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function deterministicShuffle(values, seed) {
  const output = [...values];
  const random = createRandom(seed);
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

export function scheduleRepeat(queue, current, rating) {
  const output = [...queue];
  const maxExposure = rating === "MISS" ? 3 : rating === "DOUBT" ? 2 : 1;

  if (rating === "KNOW" || current.exposure >= maxExposure) {
    return output;
  }

  const gap = rating === "MISS" ? 2 : 5;
  output.splice(Math.min(gap, output.length), 0, {
    ...current,
    exposure: current.exposure + 1,
  });

  return output;
}

export async function loadFlashcards() {
  const groups = [];
  for (let index = 1; index <= 12; index += 1) {
    const file = `u${String(index).padStart(2, "0")}.json`;
    groups.push(
      JSON.parse(await readFile(path.join(flashcardRoot, file), "utf8")),
    );
  }
  return groups.flat();
}

export async function validateFlashcardEngine() {
  const failures = [];
  const cards = await loadFlashcards();

  if (cards.length !== 80) {
    failures.push(`Expected 80 flashcards, got ${cards.length}`);
  }

  const ids = new Set();
  for (const card of cards) {
    if (ids.has(card.id)) failures.push(`Duplicate flashcard ${card.id}`);
    ids.add(card.id);

    if (!card.front?.trim()) failures.push(`${card.id} missing front`);
    if (!card.back?.trim()) failures.push(`${card.id} missing back`);
  }

  const requiredFiles = [
    "app/tarjetas/page.tsx",
    "app/tarjetas/sesion/page.tsx",
    "app/tarjetas/resultados/page.tsx",
    "components/flashcards/flashcard-setup.tsx",
    "components/flashcards/flashcard-session.tsx",
    "components/flashcards/flashcard-player.tsx",
    "components/flashcards/flashcard-results.tsx",
    "components/flashcards/flashcard-rich-text.tsx",
    "lib/content/flashcard-content.ts",
    "lib/flashcards/engine.ts",
    "lib/storage/flashcard-history.ts",
    "types/flashcard-session.ts",
    "schemas/flashcard-history.schema.json",
  ];

  for (const file of requiredFiles) {
    try {
      await access(path.join(root, file));
    } catch {
      failures.push(`Missing ${file}`);
    }
  }

  const typeSource = await readFile(
    path.join(root, "types/flashcard-session.ts"),
    "utf8",
  );

  for (const rating of ["MISS", "DOUBT", "KNOW"]) {
    if (!typeSource.includes(`"${rating}"`)) {
      failures.push(`Missing rating ${rating}`);
    }
  }

  if (!typeSource.includes("[10, 20, 30] as const")) {
    failures.push("Flashcard sizes 10/20/30 are not canonical");
  }

  const engine = await readFile(
    path.join(root, "lib/flashcards/engine.ts"),
    "utf8",
  );

  for (const token of [
    'rating === "MISS" ? 2 : 5',
    'rating === "MISS" ? 3 : rating === "DOUBT" ? 2 : 1',
    '"ADAPTIVE"',
    "reversible",
  ]) {
    if (!engine.includes(token)) {
      failures.push(`Flashcard engine missing ${token}`);
    }
  }

  const first = deterministicShuffle(cards.map((card) => card.id), 12345);
  const second = deterministicShuffle(cards.map((card) => card.id), 12345);

  if (JSON.stringify(first) !== JSON.stringify(second)) {
    failures.push("Flashcard shuffle is not deterministic");
  }

  return {
    failures,
    counts: {
      cards: cards.length,
      reversible: cards.filter((card) => card.reversible).length,
      units: new Set(cards.map((card) => card.unitId)).size,
      concepts: new Set(cards.map((card) => card.primaryConceptId)).size,
    },
  };
}
