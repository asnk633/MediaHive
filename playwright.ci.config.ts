import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default defineConfig({
  testDir: 'e2e/playwright',
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0, // Reduced retries for CI
  workers: process.env.CI ? 1 : undefined,
  expect: { timeout: 30_000 }, // Increased expect timeout
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry', // Enable tracing for failed tests
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: true,
  },
});