import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright test configuration for Thaiba Garden Media Manager (M2)
 *
 * - testDir: e2e/playwright (where your specs live)
 * - reporters: list + html (report generation)
 * - projects: Desktop Chrome, Firefox, Safari (Desktop Safari via WebKit)
 *
 * Adjust baseURL, retries, or webServer as necessary for CI/local dev.
 */

export default defineConfig({
  testDir: "e2e/playwright",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  // Run tests in parallel where safe; set retries in CI
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["list"],
    ["html", { open: "never" }]
  ],

  use: {
    // Base URL for the app under test. Adjust if your dev server runs elsewhere.
    baseURL: process.env.PW_BASE_URL || "http://localhost:3000",

    // Trace only on first retry to help triage flaky tests
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video capture for debugging (disabled by default in CI)
    video: process.env.CI ? "retain-on-failure" : "off",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"]
      }
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"]
      }
    }
  ],

  // Local dev helper — uncomment when running tests and you want Playwright to start the app automatically
  // webServer: {
  //   command: "npm run dev",
  //   port: 3000,
  //   timeout: 120_000,
  //   reuseExistingServer: false,
  // },

// playwright.config.ts (snippet)
export default defineConfig({
  testDir: "e2e/playwright",
  // ...existing settings...
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run dev",      // change to pnpm/yarn if needed
    url: "http://localhost:3000",
    timeout: 120_000,            // wait up to 2 minutes for server
    reuseExistingServer: true,   // if a server is already running, reuse it
  },
});

