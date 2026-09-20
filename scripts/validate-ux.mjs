import { validateUxAccessibility } from "./ux-validation-lib.mjs";

const result = await validateUxAccessibility();
if (result.failures.length) {
  console.error(result.failures.join("\n"));
  process.exit(1);
}
console.log("UX_VALIDATION=PASS");
console.log("RESPONSIVE_DESKTOP_TABLET_MOBILE=PASS");
console.log("KEYBOARD_FOCUS=PASS");
console.log("SKIP_LINK=PASS");
console.log("ACTIVE_NAVIGATION=PASS");
console.log("THEME_LIGHT_DARK_SYSTEM=PASS");
console.log("EMPTY_ERROR_STATES=PASS");
console.log("QUIZ_ACCESSIBILITY=PASS");
console.log("FLASHCARD_ACCESSIBILITY=PASS");
console.log("PROGRESS_SEMANTICS=PASS");
console.log("REDUCED_MOTION_FORCED_COLORS=PASS");
