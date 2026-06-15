import { test, expect } from '@playwright/test';

test('Guest Notification Flow', async ({ page }) => {
    test.setTimeout(120000); // 120s timeout

    // Log console from browser
    page.on('console', msg => {
        console.log(`[BROWSER][${msg.type()}] ${msg.text()}`);
    });

    // 1. Login as Guest
    await page.goto('/login');
    await page.evaluate(() => {
        localStorage.setItem('mediahive_onboarding_complete', 'true');
        localStorage.setItem('hasSeenMemberWelcome-v1', 'true');
    });
    await page.fill('input[type="email"]', 'shuaibmse007@gmail.com');
    await page.fill('input[type="password"]', 'amarthaiba@thaiba');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*home/, { timeout: 30000 });

    // 2. Create Task
    await page.goto('/tasks/new');
    await page.fill('input[placeholder="What needs to be done?"]', 'AutoNotify Task ' + Date.now());
    await page.fill('textarea[placeholder*="details"]', 'Testing notification via Playwright');

    // Set Date (Future) using the keyboard shortcut Alt+ArrowRight
    await page.keyboard.press('Alt+ArrowRight');

    // Select Department/Institution via DropdownSelector if available and enabled
    const deptTrigger = page.locator('button').filter({ hasText: /Select option|None/ }).first();
    if (await deptTrigger.count() > 0 && await deptTrigger.isVisible() && await deptTrigger.isEnabled()) {
        await deptTrigger.click();
        const deptOption = page.locator('[role="presentation"] button, [data-radix-popper-content-wrapper] button').filter({ hasNotText: 'None' }).first();
        if (await deptOption.count() > 0) {
            await deptOption.click();
        } else {
            await page.keyboard.press('Escape');
        }
    }

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*tasks/, { timeout: 30000 });
    console.log("Guest task created.");

    // Wait for the background notification requests to complete before logging out
    await page.waitForTimeout(3000);

    // 3. Logout
    await page.locator('button:has(img[alt="Avatar"]), button:has-text("Avatar"), button:has-text("shuhaib ev"), button:has-text("E2E Test User")').filter({ visible: true }).first().click(); // Avatar
    const signOutBtn = page.getByRole('menuitem', { name: /sign\s*out/i }).first();
    await signOutBtn.waitFor({ state: 'visible', timeout: 10000 });
    await signOutBtn.click();
    await expect(page).toHaveURL(/.*(?:login|welcome)/, { timeout: 30000 });
    
    // Purge browser state to prevent session re-hydration bugs
    await page.context().clearCookies();
    await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();
        if (window.indexedDB && window.indexedDB.databases) {
            const dbs = await window.indexedDB.databases();
            for (const db of dbs) {
                if (db.name) window.indexedDB.deleteDatabase(db.name);
            }
        }
    });
    await page.reload();
    await expect(page).toHaveURL(/.*login/, { timeout: 30000 });

    // 4. Login as Admin
    await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
    await page.fill('input[type="email"]', 'media@thaibagarden.com');
    await page.fill('input[type="password"]', 'media@thaiba');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*home/, { timeout: 30000 });

    // 5. Check Notification
    // Look for Bell icon by ID
    await page.locator('#notification-bell').filter({ visible: true }).first().click();

    // Wait for dropdown
    await page.waitForSelector('text=Task Assignment Required', { timeout: 10000 });
    console.log("Admin notification found.");

    // 6. Verify Task in List
    await page.goto('/tasks');
    await page.click('text=All Tasks'); // Switch to All Tasks tab
    // Verify the guest-created task appears in the task list
    await expect(page.locator('text=AutoNotify Task').first()).toBeVisible({ timeout: 10000 });
    console.log("Pending task visible.");
});
