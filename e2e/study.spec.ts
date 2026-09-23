import { expect, test } from "@playwright/test";
import { units } from "./support/content";
import { watchPage } from "./support/helpers";

const u01 = units[0];
const u02 = units[1];

test.describe("experiencia de estudio", () => {
  test("abrir U01, marcar estado, navegar a U02 y conservar el progreso al recargar", async ({ page }) => {
    const diagnostics = watchPage(page);

    await page.goto("/estudiar/b1/u01");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(u01.title);
    await expect(page.locator(".breadcrumbs")).toContainText("U01");
    await expect(page.locator(".unit-progress-controls")).toContainText("En curso");

    await page.getByRole("button", { name: "Marcar como estudiada" }).click();
    await expect(page.locator(".unit-progress-controls")).toContainText("Estudiada");

    const stored = await page.evaluate(() => window.localStorage.getItem("pp-study-progress-v1"));
    expect(stored).not.toBeNull();
    expect(stored).toContain("U01");

    await page.getByRole("link", { name: /Siguiente/ }).click();
    await expect(page).toHaveURL(/\/estudiar\/b1\/u02$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(u02.title);

    await page.goBack();
    await expect(page).toHaveURL(/\/estudiar\/b1\/u01$/);
    await expect(page.locator(".unit-progress-controls")).toContainText("Estudiada");

    await page.reload();
    await expect(page.locator(".unit-progress-controls")).toContainText("Estudiada");

    diagnostics.assertClean("estudio U01");
  });

  test("el índice del bloque resume las 12 unidades y su progreso", async ({ page }) => {
    const response = await page.goto("/estudiar/b1");

    expect(response!.status()).toBe(200);
    await expect(page.locator(".unit-card")).toHaveCount(12);
    await expect(page.locator(".study-progress-panel")).toContainText(`/12 unidades estudiadas`);

    for (const unit of units) {
      await expect(
        page.locator(`.unit-card[href="/estudiar/b1/${unit.unitId.toLowerCase()}"]`),
      ).toHaveCount(1);
    }
  });

  test("la unidad enlaza con su contexto de práctica", async ({ page }) => {
    await page.goto("/estudiar/b1/u05");

    const practiceLink = page.getByRole("link", { name: /Ir a práctica/ });
    await expect(practiceLink).toHaveAttribute("href", "/tests?unit=u05");

    await practiceLink.click();
    await expect(page).toHaveURL(/\/tests\?unit=u05/);
    await expect(page.getByRole("radio", { name: /Por unidad/ })).toBeChecked();
  });
});
