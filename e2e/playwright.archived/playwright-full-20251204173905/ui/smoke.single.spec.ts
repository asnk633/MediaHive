import { test, expect } from '@playwright/test';

test('basic smoke: load home and check title', async ({ page }) => {
    await page.goto(process.env.PLAYWRIGHT_TEST_URL || 'http://localhost:3000');
    await expect(page).toHaveTitle(/Thaiba|Thaiba Garden|Media Manager/);
});
