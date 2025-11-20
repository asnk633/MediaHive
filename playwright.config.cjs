// playwright.config.cjs
const { devices } = require('@playwright/test');

module.exports = {
  testDir: 'e2e/playwright',
  reporter: [['list'], ['html', { outputFolder: 'test-report' }]],
  timeout: 60_000,
  expect: { timeout: 5000 },
  use: {
    headless: false,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1280, height: 800 },
    actionTimeout: 20_000,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
};