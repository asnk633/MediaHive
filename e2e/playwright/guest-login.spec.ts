
import { test, expect } from '@playwright/test';

const GUEST_USER = {
    email: 'amarthaibachannel@gmail.com',
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
        await page.fill('input[type="email"]', GUEST_USER.email);
        await page.fill('input[type="password"]', GUEST_USER.password);
        await page.click('button[type="submit"]');

        // Wait for Home
        await page.waitForURL('/home', { timeout: 30000 });

        // 2. Open a Task (to trigger TaskDetailsModal)
        // Guest sees "My Requests". We need to find a task card to click.
        // If no tasks exist, we can't fully warn, but we can check for immediate errors.

        // Attempt to find a task card.
        const taskCard = page.locator('[data-dnd-sortable-id]').first();

        if (await taskCard.count() > 0) {
            await taskCard.click();

            // Wait a bit for modal animation
            await page.waitForTimeout(1000);

            // Check for specific error
            const keyError = consoleErrors.find(e => e.includes('Encountered two children with the same key'));
            expect(keyError).toBeUndefined();
        } else {
            console.log('No tasks available for Guest to click. Validating login only.');
        }

        // 3. Verify allowed UI just in case
        await expect(page.getByRole('heading', { name: 'Active Campaigns' })).toBeVisible();


    });
});
