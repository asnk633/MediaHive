import { Page, expect } from '@playwright/test';

export async function safeGoto(page: Page, url: string) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
}
