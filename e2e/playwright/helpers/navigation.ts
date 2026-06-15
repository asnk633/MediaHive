import { Page, expect } from '@playwright/test';

export async function safeGoto(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

export async function waitForMessage(page: Page, text: string) {
  const messageLocator = page.locator(`text=${text}`).first();
  await expect(messageLocator).toBeVisible({ timeout: 10000 });
}