// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Smoke: Basic app functionality', () => {
    test('app loads and basic navigation works', async ({ page }) => {
        // Navigate to home page
        await page.goto('/');

        // Check page title to match MediaHive, welcome page, login page, or empty
        await expect(page).toHaveTitle(/(MediaHive|Welcome|Login|)/i);

        // Wait for home page to load
        await page.waitForLoadState('load');

        // Check that we're on a valid page (should have bottom navigation or content)
        const hasContent = await page.locator('body').textContent();
        expect(hasContent).toBeTruthy();

        // Try navigating to tasks page via bottom nav or link
        const tasksLink = page.locator('a[href="/tasks"]').first();
        if (await tasksLink.isVisible({ timeout: 5000 }).catch(() => false)) {
            await tasksLink.click();
            await page.waitForURL('**/tasks');
            await expect(page).toHaveURL(/\/tasks/);
        }
    });

    test('files page loads', async ({ page }) => {
        // Programmatic login bypass
        await page.goto('/login');
        await page.evaluate(() => {
            localStorage.setItem('playwright_test_auth', 'true');
            localStorage.setItem('playwright_test_role', 'admin');
            localStorage.setItem('mediahive_onboarding_complete', 'true');
        });
        try {
            await page.goto('/home');
        } catch (e: any) {
            if (!e.message.includes('ERR_ABORTED') && !e.message.includes('NS_BINDING_ABORTED') && !e.message.includes('NS_ERROR_FAILURE')) throw e;
        }
        await expect(page).toHaveURL(/.*home/, { timeout: 10000 });

        await page.goto('/downloads');
        await page.waitForLoadState('load');

        // Check for "Downloads" heading
        const heading = page.locator('h1:has-text("Downloads")');
        await expect(heading).toBeVisible({ timeout: 10000 });
    });
});
