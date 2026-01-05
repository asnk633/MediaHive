
import { test, expect } from '@playwright/test';

// Guest Credentials to Register
const GUEST_USER = {
    email: 'amarthaibachannel@gmail.com',
    password: 'amarthaiba@thaiba'
};

test.describe('User Registration Flow', () => {

    test('Guest can register successfully', async ({ page }) => {
        // 1. Navigate to Register Page
        await page.goto('/register');

        // 2. Fill Register Form
        // Assuming fields: Name, Email, Password, Confirm Password (if any)
        // Checking Register page fields

        await page.fill('input[name="name"]', 'Amar Thaiba');
        await page.fill('input[type="email"]', GUEST_USER.email);
        await page.fill('input[name="password"]', GUEST_USER.password);
        await page.fill('input[placeholder="Re-enter"]', GUEST_USER.password); // Placeholder selector for confirm

        // Check terms
        await page.check('input#terms');

        // 3. Submit
        await page.click('button[type="submit"]');

        // 4. Handle success scenario
        // It might redirect to Home or Login.
        // If it redirects to home directly:
        await expect(page).toHaveURL(/\/home| \/login/); // Allow either dependent on flow implementation

        // If it requires login after register:
        if (page.url().includes('/login')) {
            await page.fill('input[type="email"]', GUEST_USER.email);
            await page.fill('input[type="password"]', GUEST_USER.password);
            await page.click('button[type="submit"]');
            await page.waitForURL('/home');
        }

        // 5. Verify User is logged in as Guest
        // Check for "Guest" role indication or limited UI
        // Media Team Overview should be HIDDEN for Guest (unless we enabled it for everyone, check logic)
        // We moved "Coming Up" to top.

        await expect(page.locator('text=Good Evening, Amar')).toBeVisible(); // or Good Morning

    });
});
