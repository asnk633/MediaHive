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
  timeout: 60_000,
  expect: {
    timeout: 30_000,
  },

  // Run tests in parallel where safe; set retries in CI
  fullyParallel: true,
  retries: 2,
  workers: 3,

  reporter: [
    ["list"],
    ["html", { outputFolder: 'test-results/html', open: "never" }]
  ],
  outputDir: 'test-results/raw',

  use: {
    // Base URL for the app under test. Adjust if your dev server runs elsewhere.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,

    // Run in headless mode by default
    headless: true,

    // Navigation and action timeouts
    navigationTimeout: 30000,
    actionTimeout: 30000,

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

  // Local dev helper — automatically start the app when running tests
  webServer: {
    command: "npm run dev",
    port: parseInt(process.env.PORT || "3000"),
    timeout: 120_000,
    reuseExistingServer: true,
  },
});