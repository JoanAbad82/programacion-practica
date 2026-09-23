import { expect, test, type Page } from "@playwright/test";
import { getQuestion, sessionIds, wrongOptionId } from "./support/content";
import { watchPage } from "./support/helpers";

const plain = (value: string) =>
  value
    .replace(/```[a-zA-Z-]*\n([\s\S]*?)```/g, "$1")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();

const filterSelect = (page: Page, label: string) =>
  page.locator(`.quiz-filter-grid label:has(span:text-is("${label}")) select`);

async function answer(page: Page, questionId: string, outcome: "correct" | "incorrect") {
  const question = getQuestion(questionId);
  const optionId = outcome === "correct" ? question.correctOptionId : wrongOptionId(question);

  await page.locator(`label.quiz-option:has(input[value="${optionId}"])`).click();
  await page.getByRole("button", { name: "Responder" }).click();

  const feedback = page.locator(".quiz-feedback");
  await expect(feedback).toBeVisible();
  await expect(feedback.locator("strong")).toHaveText(
    outcome === "correct" ? "Respuesta correcta" : "Respuesta incorrecta",
  );

  const explanation = await feedback.locator(".quiz-explanation").innerText();
  expect(explanation.replace(/\s+/g, " ").trim()).toContain(plain(question.explanation).slice(0, 20));

  if (outcome === "incorrect") {
    const shown = await feedback.innerText();
    const expected = plain(
      question.options.find((option) => option.id === question.correctOptionId)!.text,
    );
    expect(shown.replace(/\s+/g, " ")).toContain(expected.slice(0, 20));
  }
}

async function advance(page: Page, last: boolean) {
  await page.getByRole("button", { name: last ? "Ver resultados" : "Siguiente" }).click();
}

async function startQuiz(page: Page, options: { mode?: RegExp; size?: string; unit?: string } = {}) {
  await page.goto("/tests");
  if (options.mode) {
    await page.getByRole("radio", { name: options.mode }).check();
  }
  if (options.unit) {
    await filterSelect(page, "Unidad").selectOption(options.unit);
  }
  if (options.size) {
    await filterSelect(page, "Tamaño").selectOption(options.size);
  }
  await page.getByRole("button", { name: "Iniciar test" }).click();
  await expect(page).toHaveURL(/\/tests\/sesion\?/);
  return sessionIds(page.url());
}

test.describe("motor de tests", () => {
  test("sesión completa: feedback correcto/incorrecto, resultados y revisión de errores", async ({ page }) => {
    test.setTimeout(240_000);
    const diagnostics = watchPage(page);

    const ids = await startQuiz(page, { size: "10" });
    expect(ids).toHaveLength(10);
    await expect(page.locator(".quiz-question-topline")).toContainText("Pregunta 1 de 10");

    for (const [index, id] of ids.entries()) {
      await expect(page.locator(".quiz-question-topline")).toContainText(
        `Pregunta ${index + 1} de 10`,
      );
      await answer(page, id, index < 3 ? "correct" : "incorrect");
      await advance(page, index === ids.length - 1);
    }

    await expect(page).toHaveURL(/\/tests\/resultados\?sid=/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("3 / 10");
    await expect(page.locator(".quiz-results-percentage")).toContainText("30%");
    await expect(page.locator(".quiz-error-review")).toContainText("7 respuestas para revisar");
    await expect(page.locator(".quiz-error-item")).toHaveCount(7);
    await expect(page.getByRole("link", { name: "Repasar errores" })).toBeVisible();

    diagnostics.assertClean("sesión de test");
  });

  test("una sesión interrumpida se reanuda en la pregunta pendiente", async ({ page }) => {
    const ids = await startQuiz(page, { size: "10" });

    await answer(page, ids[0], "correct");
    await advance(page, false);
    await answer(page, ids[1], "incorrect");
    await advance(page, false);
    await expect(page.locator(".quiz-question-topline")).toContainText("Pregunta 3 de 10");

    const sessionId = new URL(page.url()).searchParams.get("sid")!;
    await page.reload();
    await expect(page.locator(".quiz-question-topline")).toContainText("Pregunta 3 de 10");
    await expect(page.locator(".quiz-question-prompt")).toBeVisible();

    const stored = await page.evaluate(() => window.localStorage.getItem("pp-quiz-history-v1"));
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).sessions[sessionId].attempts).toHaveLength(2);
  });

  test("los cuatro modos arrancan con su configuración real", async ({ page }) => {
    test.setTimeout(240_000);

    // Bloque completo
    let ids = await startQuiz(page, { size: "10" });
    expect(ids).toHaveLength(10);
    await expect(page.locator(".quiz-session-header")).toContainText("Bloque completo");

    // Por unidad
    ids = await startQuiz(page, { mode: /Por unidad/, unit: "U05", size: "10" });
    expect(ids.every((id) => getQuestion(id).unitId === "U05")).toBe(true);
    await expect(page.locator(".quiz-session-header")).toContainText("Por unidad");

    // Adaptativo V1
    ids = await startQuiz(page, { mode: /Adaptativo/, size: "10" });
    expect(ids).toHaveLength(10);
    await expect(page.locator(".quiz-session-header")).toContainText("Adaptativo V1");

    // Errores: se generan dos fallos y después se comprueba el modo de repaso
    const errorIds = await startQuiz(page, { size: "10" });
    await answer(page, errorIds[0], "incorrect");
    await advance(page, false);
    await answer(page, errorIds[1], "incorrect");
    await advance(page, false);

    await page.goto("/tests");
    await page.getByRole("radio", { name: /Repasar errores/ }).check();
    await expect(page.locator(".quiz-availability")).toContainText("Errores activos: 2");

    await page.getByRole("button", { name: "Iniciar test" }).click();
    await expect(page).toHaveURL(/\/tests\/sesion\?/);
    const reviewIds = sessionIds(page.url());
    expect(reviewIds.length).toBeGreaterThan(0);
    expect(reviewIds.every((id) => errorIds.slice(0, 2).includes(id))).toBe(true);
    await expect(page.locator(".quiz-session-header")).toContainText("Repasar errores");
  });

  test("los tamaños 10, 20 y 30 se aceptan y se reflejan en la sesión", async ({ page }) => {
    test.setTimeout(240_000);

    for (const size of ["10", "20", "30"]) {
      const ids = await startQuiz(page, { size });
      expect(ids).toHaveLength(Number(size));
      await expect(page.locator(".quiz-question-topline")).toContainText(`Pregunta 1 de ${size}`);
      expect(new URL(page.url()).searchParams.get("size")).toBe(size);
    }
  });

  test("una sesión inválida o incompleta no se reconstruye", async ({ page }) => {
    await page.goto("/tests/sesion?sid=x&seed=abc&mode=block&size=10&ids=B1-Q0001");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("No se puede reconstruir");

    await page.goto("/tests/resultados");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Falta el identificador de sesión",
    );
  });
});
