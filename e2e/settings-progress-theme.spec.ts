import { expect, test, type Page } from "@playwright/test";
import { getQuestion, sessionIds, wrongOptionId } from "./support/content";
import { watchPage } from "./support/helpers";

const themeSelect = (page: Page) =>
  page.locator('select[aria-label="Apariencia de la aplicación"]').first();

async function answerTwoQuestions(page: Page) {
  await page.goto("/tests");
  await page.locator('.quiz-filter-grid label:has(span:text-is("Tamaño")) select').selectOption("10");
  await page.getByRole("button", { name: "Iniciar test" }).click();
  await expect(page).toHaveURL(/\/tests\/sesion\?/);

  const ids = sessionIds(page.url());
  const outcomes: Array<"correct" | "incorrect"> = ["correct", "incorrect"];

  for (const [index, outcome] of outcomes.entries()) {
    const question = getQuestion(ids[index]);
    const optionId = outcome === "correct" ? question.correctOptionId : wrongOptionId(question);
    await page.locator(`label.quiz-option:has(input[value="${optionId}"])`).click();
    await page.getByRole("button", { name: "Responder" }).click();
    await page.getByRole("button", { name: "Siguiente" }).click();
  }
}

test.describe("tema, ajustes y progreso", () => {
  test("el tema Sistema/Claro/Oscuro se aplica y persiste tras recargar", async ({ page }) => {
    await page.goto("/ajustes");

    await themeSelect(page).selectOption("dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await page.evaluate(() => window.localStorage.getItem("pp-theme"))).toBe("dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(themeSelect(page)).toHaveValue("dark");

    await themeSelect(page).selectOption("light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await themeSelect(page).selectOption("system");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
    await page.reload();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  });

  test("el progreso refleja la actividad real de estudio y tests", async ({ page }) => {
    const diagnostics = watchPage(page);

    await page.goto("/estudiar/b1/u01");
    await page.getByRole("button", { name: "Marcar como estudiada" }).click();
    await expect(page.locator(".unit-progress-controls")).toContainText("Estudiada");

    await answerTwoQuestions(page);

    await page.goto("/progreso");
    const hero = page.locator(".progress-hero-grid");
    await expect(hero).toContainText("1/12");
    await expect(hero).toContainText("50%");
    await expect(page.locator(".progress-unit-card").first()).toContainText("Estudio completado");
    await expect(page.locator(".progress-concept-row").first()).toBeVisible();

    diagnostics.assertClean("progreso");
  });

  test("borrar el progreso local limpia el aprendizaje y conserva el tema", async ({ page }) => {
    await page.goto("/ajustes");
    await themeSelect(page).selectOption("dark");

    await page.goto("/estudiar/b1/u01");
    await page.getByRole("button", { name: "Marcar como estudiada" }).click();
    await expect(page.locator(".unit-progress-controls")).toContainText("Estudiada");
    await answerTwoQuestions(page);

    await page.goto("/ajustes");
    await page.getByRole("button", { name: "Borrar progreso local" }).click();
    await page.getByRole("button", { name: "Sí, borrar progreso" }).click();
    await expect(page.getByRole("status")).toContainText("El progreso local se ha borrado");

    const storage = await page.evaluate(() => ({
      study: window.localStorage.getItem("pp-study-progress-v1"),
      quiz: window.localStorage.getItem("pp-quiz-history-v1"),
      cards: window.localStorage.getItem("pp-flashcard-history-v1"),
      theme: window.localStorage.getItem("pp-theme"),
    }));

    expect(storage.study).toBeNull();
    expect(storage.quiz).toBeNull();
    expect(storage.cards).toBeNull();
    expect(storage.theme).toBe("dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.goto("/progreso");
    await expect(page.locator(".progress-hero-grid")).toContainText("0/12");
  });
});
