import { Page } from '@playwright/test';

export async function safeGoto(page: Page, path: string) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
}
