import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateUxAccessibility } from "../scripts/ux-validation-lib.mjs";

const root = process.cwd();
const read = (file) => readFile(path.join(root, file), "utf8");

test("Phase 7 UX/accessibility validator passes", async () => {
  const result = await validateUxAccessibility();
  assert.deepEqual(result.failures, []);
});

test("layout exposes a keyboard skip link and main target", async () => {
  const source = await read("app/layout.tsx");
  assert.match(source, /Saltar al contenido/);
  assert.match(source, /id="main-content"/);
});

test("main navigation exposes mobile state and current page", async () => {
  const source = await read("components/layout/site-header.tsx");
  assert.match(source, /aria-expanded/);
  assert.match(source, /aria-current/);
  assert.match(source, /aria-controls="primary-navigation"/);
});

test("theme control supports system, light and dark without effect setState", async () => {
  const source = await read("components/common/theme-toggle.tsx");
  assert.match(source, /useSyncExternalStore/);
  assert.doesNotMatch(source, /setTheme\(/);
  for (const value of ["system", "light", "dark"]) assert.match(source, new RegExp(`value="${value}"`));
});

test("responsive CSS includes focus, reduced-motion and forced-colors safeguards", async () => {
  const source = await read("app/globals.css");
  assert.match(source, /:focus-visible/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /forced-colors/);
  assert.match(source, /max-width: 820px/);
});

test("quiz answer group and progress indicator use native accessible semantics", async () => {
  const source = await read("components/quiz/quiz-question-step.tsx");
  assert.match(source, /<fieldset/);
  assert.match(source, /role="progressbar"/);
  assert.match(source, /aria-valuenow/);
});

test("flashcard self-rating explains all three outcomes", async () => {
  const source = await read("components/flashcards/flashcard-player.tsx");
  assert.match(source, /No la sabía/);
  assert.match(source, /Dudé/);
  assert.match(source, /La sabía/);
  assert.match(source, /Repetir pronto/);
});

test("application has dedicated not-found and recoverable error states", async () => {
  const notFound = await read("app/not-found.tsx");
  const error = await read("app/error.tsx");
  assert.match(notFound, /404/);
  assert.match(error, /Volver a intentar/);
});

test("local data reset preserves theme and clears all learning histories", async () => {
  const source = await read("components/settings/local-data-controls.tsx");
  assert.match(source, /pp-study-progress-v1/);
  assert.match(source, /pp-quiz-history-v1/);
  assert.match(source, /pp-flashcard-history-v1/);
  assert.doesNotMatch(source, /removeItem\("pp-theme"\)/);
});
