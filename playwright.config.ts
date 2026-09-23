import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PP_E2E_PORT ?? 4310);
const baseURL = `http://127.0.0.1:${port}`;

/**
 * RC1 end-to-end gate.
 *
 * Runs against the production build (`next start`) on a port reserved for QA so
 * it never collides with the manual acceptance server on 3000.
 *
 *   npm run build && npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ["list"],
    ["json", { outputFile: "qa/playwright-report.json" }],
    ["html", { outputFolder: "qa/playwright-report", open: "never" }],
  ],
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
