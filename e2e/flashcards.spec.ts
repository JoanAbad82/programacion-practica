import { expect, test, type Page } from "@playwright/test";
import { sessionIds } from "./support/content";
import { watchPage } from "./support/helpers";

type FlashcardHistory = {
  sessions: Record<
    string,
    {
      queue: Array<{ cardId: string; direction: string; exposure: number }>;
      attempts: Array<{ cardId: string; rating: string; exposure: number }>;
      completedAt: string | null;
    }
  >;
  cardStats: Record<string, { seen: number; miss: number; doubt: number; know: number }>;
};

async function readHistory(page: Page): Promise<FlashcardHistory> {
  const raw = await page.evaluate(() => window.localStorage.getItem("pp-flashcard-history-v1"));
  expect(raw).not.toBeNull();
  return JSON.parse(raw!) as FlashcardHistory;
}

const filterSelect = (page: Page, label: string) =>
  page.locator(`.flashcard-filter-grid label:has(span:text-is("${label}")) select`);

async function startCards(
  page: Page,
  options: { mode?: RegExp; size?: string; unit?: string } = {},
) {
  await page.goto("/tarjetas");
  if (options.mode) {
    await page.getByRole("radio", { name: options.mode }).check();
  }
  if (options.unit) {
    await filterSelect(page, "Unidad").selectOption(options.unit);
  }
  if (options.size) {
    await filterSelect(page, "Tamaño inicial").selectOption(options.size);
  }
  await page.getByRole("button", { name: "Iniciar tarjetas" }).click();
  await expect(page).toHaveURL(/\/tarjetas\/sesion\?/);
  return sessionIds(page.url());
}

function sessionIdOf(page: Page) {
  return new URL(page.url()).searchParams.get("sid")!;
}

async function currentCard(page: Page) {
  const text = (await page.locator(".flashcard-session-topline").innerText()).replace(/\s+/g, " ");
  const match = /(\d+) pendientes · (B1-FC\d+)/.exec(text);
  if (!match) throw new Error(`Topline inesperada: ${text}`);
  return { remaining: Number(match[1]), cardId: match[2] };
}

async function revealAndRate(page: Page, rating: "No la sabía" | "Dudé" | "La sabía") {
  await page.getByRole("button", { name: "Mostrar respuesta" }).click();
  await expect(page.locator(".flashcard-rating-panel")).toBeVisible();
  await page.getByRole("button", { name: new RegExp(rating) }).click();
}

test.describe("flashcards", () => {
  test("las tres valoraciones actualizan el estado y sobreviven a la recarga", async ({ page }) => {
    const diagnostics = watchPage(page);
    const ids = await startCards(page, { size: "10" });
    expect(ids).toHaveLength(10);

    await revealAndRate(page, "No la sabía");
    let history = await readHistory(page);
    let session = history.sessions[sessionIdOf(page)];
    expect(session.attempts.map((attempt) => attempt.rating)).toEqual(["MISS"]);
    expect(session.queue.length).toBe(10);
    expect(session.completedAt).toBeNull();

    await revealAndRate(page, "Dudé");
    await revealAndRate(page, "La sabía");
    history = await readHistory(page);
    session = history.sessions[sessionIdOf(page)];
    expect(session.attempts.map((attempt) => attempt.rating)).toEqual(["MISS", "DOUBT", "KNOW"]);

    const expected = await currentCard(page);
    expect(session.queue[0].cardId).toBe(expected.cardId);

    await page.reload();
    const afterReload = await currentCard(page);
    expect(afterReload.cardId).toBe(expected.cardId);
    expect(afterReload.remaining).toBe(expected.remaining);

    diagnostics.assertClean("sesión de tarjetas");
  });

  test("una sesión completada con “La sabía” termina en resultados", async ({ page }) => {
    test.setTimeout(240_000);

    const ids = await startCards(page, { size: "10" });
    expect(ids).toHaveLength(10);

    for (const id of ids) {
      const card = await currentCard(page);
      expect(id).toBe(card.cardId);
      await revealAndRate(page, "La sabía");
    }

    await expect(page).toHaveURL(/\/tarjetas\/resultados\?sid=/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("10 / 10");
    await expect(page.locator(".flashcard-results-grid")).toContainText("La sabía");

    const history = await readHistory(page);
    expect(history.sessions[sessionIdOf(page)].completedAt).not.toBeNull();

    await page.goto("/tarjetas");
    await expect(page.locator(".flashcard-history-metrics")).toContainText("1");
    await expect(page.locator(".flashcard-history-metrics")).toContainText("10");
  });

  test("el modo adaptativo no entra en bucle ni pierde el estado de la cola", async ({ page }) => {
    test.setTimeout(240_000);

    await startCards(page, { mode: /Adaptativo/, size: "10" });
    const sid = sessionIdOf(page);
    const ratings = ["No la sabía", "No la sabía", "Dudé", "No la sabía", "La sabía", "Dudé", "La sabía", "La sabía"] as const;

    for (const rating of ratings) {
      await revealAndRate(page, rating);

      const history = await readHistory(page);
      const session = history.sessions[sid];
      if (session.completedAt) break;

      expect(session.queue.length, "la cola debe conservar al menos una tarjeta pendiente").toBeGreaterThan(0);
      expect(session.queue[0].exposure, "la exposición nunca debe superar el máximo de repeticiones").toBeLessThanOrEqual(3);
    }

    const history = await readHistory(page);
    const session = history.sessions[sid];
    expect(session.attempts.length).toBe(ratings.length);
    for (const stats of Object.values(history.cardStats)) {
      expect(stats.seen).toBeLessThanOrEqual(3);
    }
    await expect(page.locator(".flashcard-session-card")).toBeVisible();
  });

  test("una sesión de tarjetas inválida muestra un estado controlado", async ({ page }) => {
    await page.goto("/tarjetas/sesion?sid=x&seed=1&mode=mixed&size=10&ids=B1-FC0001");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("No se puede reconstruir");

    await page.goto("/tarjetas/resultados");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Falta el identificador de sesión",
    );
  });
});
