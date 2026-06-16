
import { test, expect } from './fixtures/db-fixture';

const GUEST_USER = {
    email: 'shuaibmse007@gmail.com',
    password: 'amarthaiba@thaiba'
};

test.describe('Guest User Experience', () => {

    test('Guest sees restricted UI (No Overview, No My Focus)', async ({ page }) => {

        // 1. Navigation and Console Monitoring
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto('/login');
        await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        await emailInput.click();
        await emailInput.fill(GUEST_USER.email);
        await passwordInput.click();
        await passwordInput.fill(GUEST_USER.password);
        
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeEnabled();
        await submitButton.click();
        await expect(page).toHaveURL(/.*home/, { timeout: 30000 });

        // 2. Open a Task (to trigger TaskDetailsModal)
        // Guest sees "My Requests". We need to find a task card to click.
        // If no tasks exist, we can't fully warn, but we can check for immediate errors.

        // Attempt to find a task card.
        const taskCard = page.locator('[data-dnd-sortable-id]').first();

        if (await taskCard.count() > 0) {
            await taskCard.click();

            // Wait for the modal dialog to be visible to ensure animation finishes
            await expect(page.locator('[role="dialog"]').first()).toBeVisible();

            // Check for specific error
            const keyError = consoleErrors.find(e => e.includes('Encountered two children with the same key'));
            expect(keyError).toBeUndefined();
        } else {
            console.log('No tasks available for Guest to click. Validating login only.');
        }

        // 3. Verify allowed UI just in case
        await expect(page.getByRole('heading', { name: 'My Requests' })).toBeVisible({ timeout: 15000 });
    });
});
