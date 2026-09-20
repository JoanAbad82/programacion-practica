import { validateProgressAndMastery } from "./progress-validation-lib.mjs";

const result = await validateProgressAndMastery();
if (result.failures.length) {
  console.error(result.failures.join("\n"));
  process.exit(1);
}

console.log("PROGRESS_VALIDATION=PASS");
console.log(`CONCEPTS=${result.counts.concepts}/56`);
console.log(`UNITS=${result.counts.units}/12`);
console.log("MASTERY_STATES=NEW/LEARNING/UNDERSTOOD/MASTERED");
console.log("RECENT_EVIDENCE_WINDOW=12");
console.log("STUDY_QUIZ_FLASHCARDS=UNIFIED");
console.log("UNIT_PROGRESS=PASS");
console.log("BLOCK_PROGRESS=PASS");
console.log("MASTERY_AWARE_QUIZ=PASS");
console.log("MASTERY_AWARE_FLASHCARDS=PASS");
