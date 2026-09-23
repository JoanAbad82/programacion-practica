import { expect, test } from "@playwright/test";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Cloudflare Pages target: the product must be the static HTML export in
 * `out/`, so this spec asserts the artifact itself (not a server build).
 */
const outDir = path.join(process.cwd(), "out");
const unitRoutes = Array.from(
  { length: 12 },
  (_, index) => `/estudiar/b1/u${String(index + 1).padStart(2, "0")}`,
);

async function readExported(file: string) {
  return readFile(path.join(outDir, file), "utf8");
}

test.describe("artefacto de exportación estática", () => {
  test("out/index.html, out/404.html y las 12 unidades existen", async () => {
    const index = await readExported("index.html");
    expect(index).toContain('id="main-content"');

    const notFound = await readExported("404.html");
    expect(notFound).toContain("Esta página no existe.");

    for (const route of unitRoutes) {
      const file = path.join(outDir, `${route}.html`);
      const info = await stat(file);
      expect(info.size, `${file} está vacío`).toBeGreaterThan(1_000);
      expect(await readFile(file, "utf8")).toContain('class="unit-study-page"');
    }
  });

  test("el artefacto servido responde 200 y mantiene el 404 controlado", async ({ request }) => {
    for (const route of ["/", "/tests", "/tests/sesion", "/tests/resultados", "/tarjetas", "/tarjetas/sesion", "/tarjetas/resultados", "/progreso", "/ajustes", ...unitRoutes]) {
      const response = await request.get(route, { maxRedirects: 0 });
      expect(response.status(), `${route} devuelve ${response.status()}`).toBe(200);
      expect(await response.text()).toContain('id="main-content"');
    }

    const missing = await request.get("/v1-no-existe", { maxRedirects: 0 });
    expect(missing.status()).toBe(404);
    expect(await missing.text()).toContain("Esta página no existe.");
  });
});
