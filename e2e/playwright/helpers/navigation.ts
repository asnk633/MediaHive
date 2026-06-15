import { Page } from '@playwright/test';

export async function safeGoto(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  } catch (error) {
    console.log(`Failed to navigate to ${url} with networkidle, trying load state`);
    await page.goto(url, { waitUntil: 'load', timeout: 15000 });
  }
}
