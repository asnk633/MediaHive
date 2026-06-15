import { test, expect } from '@playwright/test';

const GUEST_USER = {
    email: `testuser_${Date.now()}@example.com`,
    password: 'Password123!'
};

test.describe('User Registration Flow', () => {

    test('Guest can register successfully', async ({ page }) => {
        // 1. Navigate to Signup Page
        await page.goto('/signup');

        // 2. Fill Signup Form
        await page.fill('input[placeholder="Your Name"]', 'Test E2E User');
        await page.fill('input[placeholder="your@email.com"]', GUEST_USER.email);
        
        // Fill password and confirm password
        const passwordInputs = page.locator('input[type="password"]');
        await passwordInputs.nth(0).fill(GUEST_USER.password);
        await passwordInputs.nth(1).fill(GUEST_USER.password);

        // Select a department or institution
        const deptSelect = page.locator('select').last();
        await deptSelect.selectOption({ index: 1 }); // Select the first available department

        // 3. Submit
        await page.click('button[type="submit"]');

        // 4. Verify Check Your Email screen is shown (Supabase registration success)
        await expect(page.locator('h2:has-text("Check Your Email")')).toBeVisible({ timeout: 15000 });
    });
});
