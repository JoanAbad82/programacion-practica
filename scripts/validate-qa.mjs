import { validateReleaseCandidate } from "./qa-validation-lib.mjs";

const result = await validateReleaseCandidate();

if (result.failures.length > 0) {
  console.error(result.failures.join("\n"));
  process.exit(1);
}

console.log("QA_VALIDATION=PASS");
console.log("E2E_ROUTE_CONTRACT=PASS");
console.log(`PERSISTENCE_NAMESPACES=${result.facts.persistenceNamespaces}/3`);
console.log("PERSISTENCE_ROUNDTRIP=PASS");
console.log("INTERRUPTED_QUIZ_RESUME=PASS");
console.log("INTERRUPTED_FLASHCARD_RESUME=PASS");
console.log("EMPTY_ERROR_STATES=PASS");
console.log("CROSS_MODULE_NAVIGATION=PASS");
console.log("RUNTIME_AI=ABSENT");
console.log(`RELEASE_VERSION=${result.facts.releaseVersion}`);
console.log("RC1_ACCEPTANCE=PASS");
