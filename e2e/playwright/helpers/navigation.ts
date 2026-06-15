import { Page } from '@playwright/test';

export async function safeGoto(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
}
