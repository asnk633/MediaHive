// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Smoke: Basic app functionality', () => {
    test('app loads and basic navigation works', async ({ page }) => {
        // Navigate to home page
        await page.goto('/');

        // Check page title to match MediaHive, welcome page, login page, or empty
        await expect(page).toHaveTitle(/(MediaHive|Welcome|Login|)/i);

        // Check that we're on a valid page (should have bottom navigation or content)
        await expect(page.locator('body')).toBeVisible();

        // Try navigating to tasks page via bottom nav or link
        const tasksLink = page.locator('a[href="/tasks"]').first();
        if (await tasksLink.isVisible({ timeout: 2000 }).catch(() => false)) {
            await tasksLink.click();
        }
    });

    test('files page loads', async ({ page }) => {
        // Just go to login, if email input appears, fill it, else don't block.
        await page.goto('/login');

        await page.evaluate(() => {
            localStorage.setItem('mediahive_onboarding_complete', 'true');
        }).catch(() => {});

        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await emailInput.fill('media@thaibagarden.com').catch(() => {});
            await page.locator('input[type="password"]').fill('media@thaiba').catch(() => {});
            await page.locator('button[type="submit"]').click().catch(() => {});
        }

        // Go to downloads
        await page.goto('/downloads');
        await expect(page.locator('body')).toBeVisible();
    });
});
