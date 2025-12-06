import { test, expect } from '@playwright/test';

test('Debug Login Flow', async ({ page }) => {
    console.log('Navigating to login...');
    await page.goto('/login');

    console.log('Checking for inputs...');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    console.log('Filling credentials...');
    await page.fill('input[name="email"]', 'smoke@test.local');
    await page.fill('input[name="password"]', 'Pass123');

    console.log('Clicking login...');
    await page.click('button:has-text("Login")');

    console.log('Waiting for redirect...');
    await expect(page).toHaveURL('/', { timeout: 10000 });
});
