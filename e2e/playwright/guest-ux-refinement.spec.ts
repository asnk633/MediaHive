import { test, expect } from '@playwright/test';

test.describe('Guest UX Refinement', () => {


    test('Guest User Journey: Register -> Home -> Profile', async ({ page }) => {
        // 1. Monitor for timeline widget errors in console
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        // 2. Register New Guest
        const timestamp = Date.now();
        const email = `guest_${timestamp}@test.com`;
        const password = 'password123';
        const name = `Guest ${timestamp}`;

        await page.goto('/register');
        await page.fill('input[type="text"]', name); // Name field
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        // Signup form uses two consecutive password inputs (no name attribute on confirmPassword)
        await page.locator('input[type="password"]').nth(1).fill(password);
        await page.click('button:has-text("Create Account")');

        // Wait for redirect to home
        await expect(page).toHaveURL('/home', { timeout: 30000 });

        // 3. Verify clean home page (Elements that should NOT be there)
        await expect(page.locator('text=Upcoming Events')).not.toBeVisible();
        await expect(page.locator('text=Active Campaigns')).not.toBeVisible();
        await expect(page.locator('text=Activity Feed')).not.toBeVisible();

        // 4. Verify New Widgets
        await expect(page.locator('text=Today\'s Workload')).toBeVisible();
        await expect(page.locator('text=Tasks Scheduled')).toBeVisible();
        await expect(page.locator('text=New Request')).toBeVisible(); // Quick Action
        await expect(page.locator('text=My Request Updates')).toBeVisible(); // Guest Activity Feed
        await expect(page.locator('text=Normal Operations')).toBeVisible(); // Department Status (assuming low load in test)

        // Verify "Tasks From Me" Empty State
        await expect(page.locator('text=No active requests found')).toBeVisible();

        // 5. Navigate to Profile (Reports)
        await page.goto('/reports');
        await expect(page).toHaveURL('/reports'); // Should stay on reports/profile

        // 6. Verify Profile Content
        await expect(page.locator('text=Guest Account')).toBeVisible();
        await expect(page.locator('text=Active Requests')).toBeVisible();
        await expect(page.locator('text=Completed')).toBeVisible();
        await expect(page.locator('text=Recent Request Activity')).toBeVisible();

        // 7. Verify No "Access Denied"
        await expect(page.locator('text=Access Denied')).not.toBeVisible();
    });


});
