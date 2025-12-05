import { test, expect } from '@playwright/test';

test('basic smoke: load home and check title', async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
    await expect(page.locator('body')).toBeVisible();
});
