import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e/playwright',
    timeout: 300_000,
    workers: 1,
    retries: 2,
    expect: { timeout: 10_000 },
    reporter: [['html', { outputFolder: 'test-results/html-report' }]],
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        navigationTimeout: 60_000,
        trace: 'on-first-retry',
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
        launchOptions: { slowMo: 50 },
        storageState: process.env.PLAYWRIGHT_STORAGE || 'e2e/storageState.json',
    },
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        timeout: 120_000,
        reuseExistingServer: true,
    },
});
