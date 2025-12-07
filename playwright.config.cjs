// playwright.config.cjs
const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: 'e2e/playwright',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    actionTimeout: 10_000,
    navigationTimeout: 60_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: isCI ? true : false,
    launchOptions: {
      slowMo: isCI ? 0 : 50,
    },
  },

  outputDir: 'test-results',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // ✅ Offline mode only runs locally, NOT in CI
    ...(isCI
      ? []
      : [
        {
          name: 'offline-mode',
          use: {
            ...devices['Desktop Chrome'],
            offline: true,
          },
        },
      ]),
  ],
});