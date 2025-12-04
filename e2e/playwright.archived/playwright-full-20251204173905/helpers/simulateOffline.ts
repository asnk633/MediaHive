// e2e/playwright/helpers/simulateOffline.ts
// Helper to simulate offline mode in Playwright tests

import type { Page } from "@playwright/test";

/**
 * simulateOffline - set the browser context to offline mode
 */
export async function simulateOffline(page: Page) {
  await page.context().setOffline(true);
}

/**
 * simulateOnline - set the browser context to online mode
 */
export async function simulateOnline(page: Page) {
  await page.context().setOffline(false);
}

/**
 * isOffline - check if the browser context is offline
 */
export async function isOffline(page: Page): Promise<boolean> {
  // Playwright doesn't have a direct isOffline method, so we'll check navigator.onLine
  return await page.evaluate(() => !navigator.onLine);
}