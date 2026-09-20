import { validateQuizEngine } from "./quiz-validation-lib.mjs";

const result = await validateQuizEngine();

if (result.failures.length > 0) {
  console.error(result.failures.join("\n"));
  process.exit(1);
}

console.log("QUIZ_VALIDATION=PASS");
console.log(`QUESTIONS=${result.counts.questions}/200`);
console.log(`QUIZ_MODES=${result.counts.modes}/4`);
console.log("SESSION_SIZES=10/20/30");
console.log("DETERMINISTIC_SELECTION=PASS");
console.log(`OPTION_SHUFFLES=${result.counts.optionShufflesChecked}/200`);
console.log("IMMEDIATE_FEEDBACK=PASS");
console.log("ERROR_REVIEW=PASS");
console.log("ADAPTIVE_V1=PASS");
console.log("SESSION_ID_SEED=PASS");
console.log("QUIZ_HISTORY=PASS");
