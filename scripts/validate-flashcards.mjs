import { validateFlashcardEngine } from "./flashcard-validation-lib.mjs";

const result = await validateFlashcardEngine();

if (result.failures.length > 0) {
  console.error(result.failures.join("\n"));
  process.exit(1);
}

console.log("FLASHCARD_VALIDATION=PASS");
console.log(`FLASHCARDS=${result.counts.cards}/80`);
console.log(`UNITS=${result.counts.units}/12`);
console.log(`PRIMARY_CONCEPTS=${result.counts.concepts}/56`);
console.log(`REVERSIBLE=${result.counts.reversible}/80`);
console.log("SESSION_SIZES=10/20/30");
console.log("FILTERS=UNIT/LANGUAGE/TYPE");
console.log("DETERMINISTIC_MIX=PASS");
console.log("FRONT_BACK_REVEAL=PASS");
console.log("RATINGS=MISS/DOUBT/KNOW");
console.log("ADAPTIVE_REPEAT=PASS");
console.log("LOCAL_HISTORY=PASS");
