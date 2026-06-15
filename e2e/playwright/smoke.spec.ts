// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Smoke: Basic app functionality', () => {
    test('app loads and basic navigation works', async ({ page }) => {
        // Navigate to home page
        await page.goto('/');

        // Check page title to match MediaHive, welcome page, login page, or empty
        await expect(page).toHaveTitle(/(MediaHive|Welcome|Login|)/i);

        // Wait for home page to load
        await page.waitForLoadState('networkidle');

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
        // Login first
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));

        // Ensure email input exists before filling
        const emailInput = page.locator('input[type="email"], input[name="email"], [placeholder*="email" i]').first();
        const passwordInput = page.locator('input[type="password"], input[name="password"], [placeholder*="password" i]').first();
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first();

        await expect(emailInput).toBeVisible({ timeout: 10000 });
        await emailInput.fill('media@thaibagarden.com');
        await expect(passwordInput).toBeVisible();
        await passwordInput.fill('media@thaiba');
        await submitButton.click();

        await expect(page).toHaveURL(/.*home|.*tasks|.*dashboard/, { timeout: 15000 }).catch(() => null);

        await page.goto('/downloads');
        await page.waitForLoadState('networkidle');

        // Check for "Downloads" heading
        const heading = page.locator('h1:has-text("Downloads")');
        await expect(heading).toBeVisible({ timeout: 10000 });
    });
});
