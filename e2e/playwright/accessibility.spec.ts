import { test, expect } from '@playwright/test';

test.describe('Accessibility Invariants', () => {
    test('Verify landmarks and inputs on Login page', async ({ page }) => {
        // Go to login page
        await page.goto('/login');
        await page.waitForLoadState('load');

        // 1. Verifies exactly one <main> element exists on the page
        const mainCount = await page.locator('main').count();
        expect(mainCount).toBe(1);

        // 2. Verifies the skip link is rendered and successfully references a valid container ID
        const skipLink = page.locator('.skip-link');
        await expect(skipLink).toBeAttached();
        await expect(skipLink).toHaveAttribute('href', '#main-scroll-container');

        // 3. Verifies all visible <input> fields are programmatically associated with a <label>
        const inputs = await page.locator('input:visible').all();
        for (const input of inputs) {
            const id = await input.getAttribute('id');
            // Every visible input should have an ID for label association
            expect(id).toBeTruthy();
            // There should be a label referencing this ID in the DOM
            const label = page.locator(`label[for="${id}"]`);
            await expect(label).toBeAttached();
        }
    });

    test('Verify skip-to-content keyboard navigation on Home page', async ({ page }) => {
        // Login programmatically
        await page.goto('/login');
        await page.evaluate(() => {
            localStorage.setItem('playwright_test_auth', 'true');
            localStorage.setItem('playwright_test_role', 'admin');
            localStorage.setItem('mediahive_onboarding_complete', 'true');
        });
        
        try {
            await page.goto('/home');
        } catch (e: any) {
            if (!e.message.includes('ERR_ABORTED') && !e.message.includes('NS_BINDING_ABORTED')) throw e;
        }
        await expect(page).toHaveURL(/.*home/, { timeout: 10000 });
        await page.waitForLoadState('load');

        // Verify skip link targets #main-scroll-container which exists on Home
        const scrollContainer = page.locator('#main-scroll-container');
        await expect(scrollContainer).toBeAttached();

        // Keyboard Navigation: Focus skip link using Tab
        await page.keyboard.press('Tab');
        const skipLink = page.locator('.skip-link');
        await expect(skipLink).toBeFocused();

        // Press Enter to trigger skip link
        await page.keyboard.press('Enter');
        
        // Verify URL hash updated
        await expect(page).toHaveURL(/.*home#main-scroll-container/);
    });
});
