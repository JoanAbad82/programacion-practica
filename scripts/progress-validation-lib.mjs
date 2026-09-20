import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

export function referenceMasteryState({ score, interactions, objectiveInteractions, recentSignificantFailure }) {
  if (interactions === 0) return "NEW";
  if (score >= 85 && interactions >= 6 && objectiveInteractions >= 3 && !recentSignificantFailure) return "MASTERED";
  if (score >= 70 && interactions >= 4 && objectiveInteractions >= 2) return "UNDERSTOOD";
  return "LEARNING";
}

export async function validateProgressAndMastery() {
  const failures = [];
  const requiredFiles = [
    "app/progreso/page.tsx",
    "components/progress/progress-dashboard.tsx",
    "lib/content/progress-content.ts",
    "lib/progress/mastery.ts",
    "lib/storage/unified-progress.ts",
    "types/progress.ts",
    "schemas/progress-model.schema.json",
    "schemas/progress.schema.json",
    "lib/storage/progress-repository.ts",
  ];

  for (const file of requiredFiles) {
    try { await access(path.join(root, file)); }
    catch { failures.push(`Missing ${file}`); }
  }

  const concepts = JSON.parse(
    await readFile(path.join(root, "content/block-1/concepts/concepts.json"), "utf8"),
  );
  const units = JSON.parse(
    await readFile(path.join(root, "content/block-1/canonical/units.json"), "utf8"),
  );

  if (concepts.length !== 56) failures.push(`Expected 56 concepts, got ${concepts.length}`);
  if (units.length !== 12) failures.push(`Expected 12 units, got ${units.length}`);

  const mastery = await readFile(path.join(root, "lib/progress/mastery.ts"), "utf8");
  for (const token of [
    "MASTERY_WINDOW_SIZE = 12",
    "score >= 70",
    "objectiveInteractions >= 2",
    "score >= 85",
    "objectiveInteractions >= 3",
    "recentSignificantFailure",
    "QUIZ_WEIGHTS",
    "FLASHCARD_WEIGHT",
    "STUDY_STUDIED_WEIGHT",
  ]) {
    if (!mastery.includes(token)) failures.push(`Mastery engine missing ${token}`);
  }

  const progressTypes = await readFile(path.join(root, "types/progress.ts"), "utf8");
  for (const state of ["NEW", "LEARNING", "UNDERSTOOD", "MASTERED"]) {
    if (!progressTypes.includes(`\"${state}\"`)) failures.push(`Missing state ${state}`);
  }
  if (!progressTypes.includes("PROGRESS_MODEL_V1")) failures.push("Progress model version missing");

  const quizEngine = await readFile(path.join(root, "lib/quiz/engine.ts"), "utf8");
  if (!quizEngine.includes("masteryByConcept")) failures.push("Quiz adaptive mode is not mastery-aware");
  if (!quizEngine.includes("masteryGap")) failures.push("Quiz adaptive mode lacks mastery gap");

  const flashEngine = await readFile(path.join(root, "lib/flashcards/engine.ts"), "utf8");
  if (!flashEngine.includes("masteryByConcept")) failures.push("Flashcard adaptive mode is not mastery-aware");
  if (!flashEngine.includes("masteryGap")) failures.push("Flashcard adaptive mode lacks mastery gap");

  const dashboard = await readFile(path.join(root, "components/progress/progress-dashboard.tsx"), "utf8");
  for (const label of ["Dominio medio", "Conceptos a reforzar", "Por unidad", "Cómo se calcula"]) {
    if (!dashboard.includes(label)) failures.push(`Dashboard missing ${label}`);
  }

  return { failures, counts: { concepts: concepts.length, units: units.length } };
}
