import { expect, test, type Page } from "@playwright/test";
import { getQuestion, sessionIds, unitsFor } from "./support/content";
import { watchPage } from "./support/helpers";

const b2Units = unitsFor("b2");

const filterSelect = (page: Page, label: string) =>
  page.locator(`.quiz-filter-grid label:has(span:text-is("${label}")) select`);

async function selectBlock(page: Page, block: "Bloque 1" | "Bloque 2") {
  await page.getByRole("radio", { name: block }).check();
}

test.describe("Bloque 2 integrado", () => {
  test("el estudio de Bloque 2 abre una unidad canónica", async ({ page }) => {
    const diagnostics = watchPage(page);

    const response = await page.goto("/estudiar/b2");
    expect(response!.status()).toBe(200);
    await expect(page.locator(".unit-card")).toHaveCount(12);
    await expect(page.locator(".study-progress-panel")).toContainText("/12 unidades estudiadas");

    await page.locator('.unit-card[href="/estudiar/b2/u01"]').click();
    await expect(page).toHaveURL(/\/estudiar\/b2\/u01$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(b2Units[0].title);
    await expect(page.locator(".breadcrumbs")).toContainText("Bloque 2");
    await expect(page.locator(".study-content")).toBeVisible();

    diagnostics.assertClean("estudio Bloque 2");
  });

  test("una sesión de test de Bloque 2 usa solo preguntas B2", async ({ page }) => {
    test.setTimeout(120_000);
    const diagnostics = watchPage(page);

    await page.goto("/tests");
    await selectBlock(page, "Bloque 2");
    await filterSelect(page, "Tamaño").selectOption("10");
    await page.getByRole("button", { name: "Iniciar test" }).click();

    await expect(page).toHaveURL(/\/tests\/sesion\?/);
    expect(new URL(page.url()).searchParams.get("block")).toBe("b2");

    const ids = sessionIds(page.url());
    expect(ids).toHaveLength(10);
    expect(ids.every((id) => id.startsWith("B2-"))).toBe(true);

    const question = getQuestion(ids[0]);
    await page.locator(`label.quiz-option:has(input[value="${question.correctOptionId}"])`).click();
    await page.getByRole("button", { name: "Responder" }).click();
    await expect(page.locator(".quiz-feedback")).toContainText("Respuesta correcta");
    await page.getByRole("button", { name: "Siguiente" }).click();

    const sid = new URL(page.url()).searchParams.get("sid")!;
    const stored = await page.evaluate(() => window.localStorage.getItem("pp-quiz-history-v1"));
    expect(stored).not.toBeNull();
    const session = JSON.parse(stored!).sessions[sid];
    expect(session.blockId).toBe("B2");
    expect(session.attempts).toHaveLength(1);
    expect(session.attempts[0].questionId).toBe(ids[0]);

    diagnostics.assertClean("test Bloque 2");
  });

  test("una sesión de tarjetas de Bloque 2 revela y valora una tarjeta", async ({ page }) => {
    const diagnostics = watchPage(page);

    await page.goto("/tarjetas");
    await selectBlock(page, "Bloque 2");
    await page.getByRole("button", { name: "Iniciar tarjetas" }).click();

    await expect(page).toHaveURL(/\/tarjetas\/sesion\?/);
    expect(new URL(page.url()).searchParams.get("block")).toBe("b2");

    const ids = sessionIds(page.url());
    expect(ids).toHaveLength(10);
    expect(ids.every((id) => id.startsWith("B2-"))).toBe(true);

    const topline = (await page.locator(".flashcard-session-topline").innerText()).replace(/\s+/g, " ");
    expect(topline).toContain(ids[0]);

    await page.getByRole("button", { name: "Mostrar respuesta" }).click();
    await expect(page.locator(".flashcard-rating-panel")).toBeVisible();
    await page.getByRole("button", { name: /No la sabía/ }).click();

    const sid = new URL(page.url()).searchParams.get("sid")!;
    const stored = await page.evaluate(() => window.localStorage.getItem("pp-flashcard-history-v1"));
    expect(stored).not.toBeNull();
    const session = JSON.parse(stored!).sessions[sid];
    expect(session.blockId).toBe("B2");
    expect(session.attempts.map((attempt: { rating: string }) => attempt.rating)).toEqual(["MISS"]);
    expect(session.cardIds.every((id: string) => id.startsWith("B2-"))).toBe(true);

    await page.reload();
    await expect(page.locator(".flashcard-session-card")).toBeVisible();

    diagnostics.assertClean("tarjetas Bloque 2");
  });

  test("el test rápido de Bloque 1 sigue usando preguntas B1", async ({ page }) => {
    const diagnostics = watchPage(page);

    await page.goto("/tests");
    await page.getByRole("button", { name: "Iniciar test" }).click();
    await expect(page).toHaveURL(/\/tests\/sesion\?/);

    const ids = sessionIds(page.url());
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith("B1-"))).toBe(true);

    diagnostics.assertClean("smoke Bloque 1");
  });
});
