import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function text(file) {
  return readFile(path.join(root, file), "utf8");
}

export async function validateUxAccessibility() {
  const failures = [];
  const required = [
    "app/error.tsx",
    "app/not-found.tsx",
    "components/layout/site-footer.tsx",
    "components/settings/local-data-controls.tsx",
    "scripts/validate-ux.mjs",
  ];
  for (const file of required) {
    try { await access(path.join(root, file)); } catch { failures.push(`Missing ${file}`); }
  }

  const layout = await text("app/layout.tsx");
  for (const token of ['className="skip-link"', 'href="#main-content"', 'id="main-content"', "SiteFooter"]) {
    if (!layout.includes(token)) failures.push(`Layout missing ${token}`);
  }

  const header = await text("components/layout/site-header.tsx");
  for (const token of ["aria-current", "aria-expanded", "aria-controls", "usePathname", "nav-toggle"]) {
    if (!header.includes(token)) failures.push(`Header missing ${token}`);
  }

  const theme = await text("components/common/theme-toggle.tsx");
  for (const token of ["useSyncExternalStore", 'value="system"', 'value="light"', 'value="dark"', "pp-theme"]) {
    if (!theme.includes(token)) failures.push(`Theme control missing ${token}`);
  }

  const css = await text("app/globals.css");
  for (const token of [":focus-visible", ".skip-link", ".sr-only", "min-height: 44px", "prefers-reduced-motion", "forced-colors", "max-width: 820px"]) {
    if (!css.includes(token)) failures.push(`CSS missing ${token}`);
  }

  const quiz = await text("components/quiz/quiz-question-step.tsx");
  for (const token of ["<fieldset", 'role="progressbar"', "aria-valuenow", "tabIndex={-1}", "Correcta", "Tu elección"]) {
    if (!quiz.includes(token)) failures.push(`Quiz accessibility missing ${token}`);
  }

  const cards = await text("components/flashcards/flashcard-player.tsx");
  for (const token of ["<fieldset", "aria-controls", "aria-expanded", "Repetir pronto", "Reducir frecuencia", "tabIndex={-1}"]) {
    if (!cards.includes(token)) failures.push(`Flashcard accessibility missing ${token}`);
  }

  const progress = await text("components/progress/progress-dashboard.tsx");
  if (!progress.includes('role="progressbar"') || !progress.includes("aria-valuenow")) {
    failures.push("Progress mastery bars need progressbar semantics");
  }

  const settings = await text("components/settings/local-data-controls.tsx");
  for (const key of ["pp-study-progress-v1", "pp-quiz-history-v1", "pp-flashcard-history-v1"]) {
    if (!settings.includes(key)) failures.push(`Settings missing ${key}`);
  }

  const home = await text("app/page.tsx");
  if (home.includes("Phase 1")) failures.push("Home still exposes engineering phase copy");

  return { failures, checks: 10 };
}
