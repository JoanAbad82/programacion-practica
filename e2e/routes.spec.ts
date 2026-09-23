import { expect, test } from "@playwright/test";
import { units } from "./support/content";
import { watchPage } from "./support/helpers";

const unitRoutes = units.map((unit) => `/estudiar/b1/${unit.unitId.toLowerCase()}`);

const routes = [
  "/",
  "/estudiar",
  "/estudiar/b1",
  ...unitRoutes,
  "/tests",
  "/tests/sesion",
  "/tests/resultados",
  "/tarjetas",
  "/tarjetas/sesion",
  "/tarjetas/resultados",
  "/progreso",
  "/ajustes",
];

test.describe("contrato de rutas", () => {
  test(`las ${routes.length} rutas funcionales responden sin 5xx y sin errores de consola`, async ({ page }) => {
    test.setTimeout(240_000);

    for (const route of routes) {
      const diagnostics = watchPage(page);
      const response = await page.goto(route, { waitUntil: "networkidle" });

      expect(response, `${route}: sin respuesta HTTP`).not.toBeNull();
      expect(response!.status(), `${route}: status ${response!.status()}`).toBeLessThan(500);
      expect(response!.status(), `${route}: status esperado < 400`).toBeLessThan(400);

      await expect(page.locator("main#main-content")).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      diagnostics.assertClean(route);
    }
  });

  test("la ruta inexistente devuelve 404 controlado con navegación útil", async ({ page }) => {
    const response = await page.goto("/ruta-que-no-existe-rc1");

    expect(response!.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("no existe");

    await page.getByRole("link", { name: "Ir al inicio" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("los enlaces internos principales no apuntan a destinos rotos", async ({ page, request }) => {
    test.setTimeout(120_000);

    const entryPoints = ["/", "/estudiar", "/estudiar/b1", "/progreso", "/ajustes"];
    const hrefs = new Set<string>();

    for (const entry of entryPoints) {
      await page.goto(entry, { waitUntil: "networkidle" });
      const found = await page.locator('a[href^="/"]').evaluateAll((anchors) =>
        anchors.map((anchor) => anchor.getAttribute("href") ?? ""),
      );
      for (const href of found) {
        if (!href || href.includes("?") || href.includes("#")) continue;
        hrefs.add(href);
      }
    }

    expect(hrefs.size).toBeGreaterThan(10);

    for (const href of hrefs) {
      const response = await request.get(href, { maxRedirects: 0 });
      expect(response.status(), `${href} devuelve ${response.status()}`).toBeLessThan(400);
    }
  });
});
