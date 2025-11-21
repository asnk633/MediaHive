// playwright.config.cjs
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'e2e/playwright',
  timeout: 60_000,
  expect: { timeout: 5000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    actionTimeout: 0,
    navigationTimeout: 60_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.CI ? true : false,
    launchOptions: {
      slowMo: 0
    }
  },
  outputDir: 'test-results'
});