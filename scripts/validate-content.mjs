import { validateBlock1 } from "./content-validation-lib.mjs";

const result = await validateBlock1(process.cwd());

if (!result.ok) {
  console.error(result.failures.join("\n"));
  process.exit(1);
}

console.log("CONTENT_VALIDATION=PASS");
console.log(`UNITS=${result.metrics.units}/12`);
console.log(`CONCEPTS=${result.metrics.concepts}/56`);
console.log(`QUESTIONS=${result.metrics.questions}/200`);
console.log(`FLASHCARDS=${result.metrics.flashcards}/80`);
console.log(`QUESTION_TYPES=${JSON.stringify(result.metrics.types)}`);
console.log(`QUESTION_DIFFICULTY=${JSON.stringify(result.metrics.difficulty)}`);
console.log(`ANSWER_POSITIONS=${JSON.stringify(result.metrics.answerPositions)}`);
console.log("TRACEABILITY=PASS");
console.log("CONTENT_INTEGRITY=PASS");
