import { test, expect } from '@playwright/test';

test('Guest Notification Flow', async ({ page }) => {
    test.setTimeout(60000); // 60s timeout

    // 1. Login as Guest
    await page.goto('/tasks');
    if (page.url().includes('login')) {
        await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
        await page.fill('input[type="email"]', 'shuaibmse007@gmail.com');
        await page.fill('input[type="password"]', 'amarthaiba@thaiba');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/home', { timeout: 10000 });
    }

    // 2. Create Task
    await page.goto('/tasks/new');
    await page.fill('input[placeholder*="title"]', 'AutoNotify Task ' + Date.now());
    await page.fill('textarea[placeholder*="details"]', 'Testing notification via Playwright');

    // Set Date (Future)
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2026-12-31');

    // Select Org (First Option in Group)
    const select = page.locator('select');
    await select.selectOption({ index: 2 }); // Skip placeholder

    await page.click('button[type="submit"]');
    await page.waitForURL('**/tasks', { timeout: 10000 });
    console.log("Guest task created.");

    // 3. Logout
    await page.click('div.rounded-full.bg-gradient-to-br'); // Avatar
    await page.click('text=Sign out');
    await page.waitForURL('**/login');

    // 4. Login as Admin
    await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
    await page.fill('input[type="email"]', 'media@thaibagarden.com');
    await page.fill('input[type="password"]', 'media@thaiba');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home');

    // 5. Check Notification
    // Look for Bell icon
    await page.click('button[aria-label="Notifications"]', { force: true }).catch(() => {
        // Fallback to finding svg
        return page.click('button:has(svg.lucide-bell)');
    });

    // Wait for dropdown
    await page.waitForSelector('text=New Pending Task', { timeout: 5000 });
    console.log("Admin notification found.");

    // 6. Verify Task in List
    await page.goto('/tasks');
    await page.click('text=Pending Approvals'); // or tab
    // Just check if we see "Approval Needed" pill
    await expect(page.locator('text=Approval Needed').first()).toBeVisible();
    console.log("Pending task visible.");
});
