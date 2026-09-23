import { expect, type Page } from "@playwright/test";

const BENIGN_CONSOLE = [
  /Download the React DevTools/i,
  /favicon\.ico/i,
];

export type PageDiagnostics = {
  errors: string[];
  assertClean: (context?: string) => void;
};

/**
 * Collects uncaught exceptions and console errors so that a route or a flow can
 * assert "no uncontrolled JS / hydration error" without repeating listeners.
 */
export function watchPage(page: Page): PageDiagnostics {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (BENIGN_CONSOLE.some((pattern) => pattern.test(text))) return;
    errors.push(`console.error: ${text}`);
  });

  return {
    errors,
    assertClean(context = "página") {
      expect(errors, `${context}: errores de consola/excepción`).toEqual([]);
    },
  };
}

export async function expectNoHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => {
    const documentElement = document.documentElement;
    const viewport = Math.max(documentElement.clientWidth, window.innerWidth);
    const offenders: string[] = [];

    for (const element of Array.from(document.body.querySelectorAll<HTMLElement>("body *"))) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > viewport + 1 && getComputedStyle(element).position !== "fixed") {
        const parent = element.parentElement;
        const parentOverflow = parent ? getComputedStyle(parent).overflowX : "visible";
        if (parentOverflow === "visible") offenders.push(element.className || element.tagName);
      }
    }

    return {
      viewport,
      scrollWidth: documentElement.scrollWidth,
      offenders: offenders.slice(0, 5),
    };
  });

  expect(
    metrics.scrollWidth,
    `${label}: scrollWidth ${metrics.scrollWidth} > viewport ${metrics.viewport} (offenders: ${metrics.offenders.join(", ") || "n/a"})`,
  ).toBeLessThanOrEqual(metrics.viewport + 1);
}

export async function expectHeaderDoesNotCoverContent(page: Page, label: string) {
  const layout = await page.evaluate(() => {
    const header = document.querySelector("header.site-header");
    const main = document.querySelector("main#main-content");
    const heading = main?.querySelector("h1") ?? null;
    return {
      headerBottom: header ? header.getBoundingClientRect().bottom : 0,
      mainTop: main ? main.getBoundingClientRect().top : 0,
      headingTop: heading ? heading.getBoundingClientRect().top : null,
    };
  });

  expect(layout.mainTop, `${label}: <main> no empieza después del header`).toBeGreaterThanOrEqual(
    layout.headerBottom - 2,
  );
  if (layout.headingTop !== null) {
    expect(layout.headingTop, `${label}: el h1 queda tapado por el header`).toBeGreaterThanOrEqual(
      layout.headerBottom - 2,
    );
  }
}
