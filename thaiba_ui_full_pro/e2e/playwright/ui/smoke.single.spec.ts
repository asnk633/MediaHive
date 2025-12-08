import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('[browser]', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('[pageerror]', err));
});

test('basic smoke: load home and check title', async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');

    // wait for network to settle and a short breathing time
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // wait for app marker if available (fallback to body visibility)
    const appReady = await page.locator('[data-app-ready]').count();
    if (appReady > 0) {
        await page.waitForSelector('[data-app-ready]', { state: 'visible', timeout: 15000 });
    } else {
        await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    }

    // final assertion
    await expect(page).toHaveTitle(/Thaiba Garden|Log In/i);
});
