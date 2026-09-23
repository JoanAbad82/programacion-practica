import { expect, test } from "@playwright/test";
import { expectHeaderDoesNotCoverContent, expectNoHorizontalOverflow, watchPage } from "./support/helpers";

const routes = ["/", "/estudiar", "/estudiar/b1", "/tests", "/tarjetas", "/progreso", "/ajustes"];

test.describe("responsive y accesibilidad", () => {
  for (const viewport of [
    { name: "desktop 1440x900", width: 1440, height: 900 },
    { name: "móvil 390x844", width: 390, height: 844 },
  ]) {
    test(`${viewport.name}: sin overflow horizontal y cabecera sin tapar el contenido`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of routes) {
        await page.goto(route, { waitUntil: "networkidle" });
        await expectNoHorizontalOverflow(page, `${route} @ ${viewport.name}`);
        await expectHeaderDoesNotCoverContent(page, `${route} @ ${viewport.name}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
    });
  }

  test("los controles principales son visibles y utilizables en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const toggle = page.getByRole("button", { name: "Abrir menú principal" });
    await expect(toggle).toBeVisible();
    await expect(page.locator("#primary-navigation")).toBeHidden();

    await toggle.click();
    await expect(page.locator("#primary-navigation")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cerrar menú principal" })).toBeVisible();

    await page.locator("#primary-navigation").getByRole("link", { name: "Tests" }).click();
    await expect(page).toHaveURL(/\/tests$/);
    await expect(page.locator("#primary-navigation")).toBeHidden();

    const startButton = page.getByRole("button", { name: "Iniciar test" });
    await expect(startButton).toBeVisible();
    const box = await startButton.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });

  test("la navegación principal es utilizable con teclado y expone el foco", async ({ page }) => {
    const diagnostics = watchPage(page);
    await page.goto("/");

    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();

    const outline = await page
      .locator(".skip-link")
      .evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe("none");

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();

    await page.locator(".brand").focus();
    for (const label of ["Estudiar", "Tests", "Tarjetas", "Progreso", "Ajustes"]) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
      expect(focused).toContain(label);
    }

    diagnostics.assertClean("navegación por teclado");
  });

  test("jerarquía de títulos y nombres accesibles en las rutas principales", async ({ page }) => {
    test.setTimeout(120_000);

    for (const route of routes) {
      await page.goto(route, { waitUntil: "networkidle" });

      const headings = await page
        .locator("h1, h2, h3, h4, h5, h6")
        .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));
      expect(headings.length, `${route}: sin títulos`).toBeGreaterThan(0);
      expect(headings[0], `${route}: el primer título no es h1`).toBe(1);
      expect(headings.filter((level) => level === 1).length, `${route}: h1 múltiple`).toBe(1);
      for (let index = 1; index < headings.length; index += 1) {
        expect(
          headings[index] - headings[index - 1],
          `${route}: salto de nivel h${headings[index - 1]} -> h${headings[index]}`,
        ).toBeLessThanOrEqual(1);
      }

      const unnamed = await page.evaluate(() => {
        const accessibleName = (element: Element) => {
          const aria = element.getAttribute("aria-label");
          if (aria?.trim()) return aria.trim();
          const labelledBy = element.getAttribute("aria-labelledby");
          if (labelledBy) {
            const text = labelledBy
              .split(/\s+/)
              .map((id) => document.getElementById(id)?.textContent ?? "")
              .join(" ")
              .trim();
            if (text) return text;
          }
          const labels = (element as HTMLInputElement).labels;
          if (labels && labels.length > 0) {
            const text = Array.from(labels).map((label) => label.textContent ?? "").join(" ").trim();
            if (text) return text;
          }
          return (element.textContent ?? "").trim() || element.getAttribute("title")?.trim() || "";
        };

        const offenders: string[] = [];
        for (const element of Array.from(document.querySelectorAll("main#main-content button, main#main-content select, main#main-content a[href], main#main-content input:not([type=hidden])"))) {
          if (element.closest("[aria-hidden=true]")) continue;
          if (!accessibleName(element)) offenders.push(element.outerHTML.slice(0, 90));
        }
        return offenders;
      });
      expect(unnamed, `${route}: controles sin nombre accesible`).toEqual([]);
    }
  });
});
