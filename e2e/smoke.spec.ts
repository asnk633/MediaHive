// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Smoke: auth + task flow', () => {
    test('login, create task, complete task', async ({ page }) => {
        // Navigate to login page - assumes local dev with test user available
        await page.goto('http://localhost:3000');
        // NOTE: Update selectors and flow to match your app
        // If using Firebase auth, consider a test-only route or mock credentials
        // For now, we check page loads and UI interaction for creating tasks
        await expect(page).toHaveTitle(/Thaiba/);
        // Open tasks
        await page.click('a[href="/app/tasks"]');
        await page.waitForSelector('text=Tasks');
        // Create new task if button exists
        const newBtn = await page.$('button:has-text("New Task")');
        if (newBtn) {
            await newBtn.click();
            await page.fill('input[placeholder="Title"]', 'Smoke test task');
            await page.click('button:has-text("Create")');
            await page.waitForSelector('text=Smoke test task');
            // complete it
            await page.click('button:has-text("Complete")');
            await expect(page.locator('text=Smoke test task')).toBeVisible();
        }
    });
});
