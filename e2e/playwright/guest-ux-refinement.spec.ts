import { test, expect } from '@playwright/test';

async function safeGoto(page: any, url: string) {
  try {
    await page.goto(url, { timeout: 30000, waitUntil: 'load' });
  } catch (e: any) {
    const msg = e.message || '';
    if (
      msg.includes('ERR_ABORTED') ||
      msg.includes('NS_BINDING_ABORTED') ||
      msg.includes('interrupted by another navigation') ||
      msg.includes('Frame load interrupted') ||
      msg.includes('Navigation timeout')
    ) {
      await page.waitForLoadState('load').catch(() => {});
      return;
    }
    throw e;
  }
}

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

        await page.goto('/signup');
        await page.fill('input[placeholder="Your Name"]', name);
        await page.fill('input[placeholder="your@email.com"]', email);
        const passwordInputs = page.locator('input[type="password"]');
        await passwordInputs.nth(0).fill(password);
        await passwordInputs.nth(1).fill(password);

        // Select an institution/department
        const deptSelect = page.locator('select').last();
        if (await deptSelect.count() > 0 && await deptSelect.isVisible()) {
            await deptSelect.selectOption({ index: 1 });
        }

        await page.click('button[type="submit"]');

        // Verify Check Your Email screen is shown or auto-login redirected to welcome/home
        try {
            await expect(page.locator('h2:has-text("Check Your Email")').or(page.locator('h1:has-text("Welcome")')).or(page.locator('h2:has-text("Welcome")'))).toBeVisible({ timeout: 15000 });
        } catch (e) {
            if (!page.url().includes('welcome') && !page.url().includes('home')) {
                throw e;
            }
        }

        // Bypass and login programmatically as Member to continue the journey
        // We are already on the correct origin (after signup / welcome), so we can inject localStorage directly
        await page.evaluate(() => {
            localStorage.setItem('playwright_test_auth', 'true');
            localStorage.setItem('playwright_test_role', 'member');
            localStorage.setItem('mediahive_onboarding_complete', 'true');
            localStorage.setItem('hasSeenMemberWelcome-v1', 'true');
        });
        await safeGoto(page, '/home');
        await expect(page).toHaveURL('/home', { timeout: 30000 });

        // 3. Verify clean home page (Elements that should NOT be there)
        await expect(page.locator('text=Upcoming Events')).not.toBeVisible();
        await expect(page.locator('text=Active Campaigns')).not.toBeVisible();
        await expect(page.locator('text=Activity Feed')).not.toBeVisible();

        // 4. Verify New Widgets
        await expect(page.locator('text=My Requests')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Personal Summary')).toBeVisible({ timeout: 10000 });
        await expect(page.locator("text=Today's Tasks")).toBeVisible({ timeout: 10000 });
        await expect(page.locator("text=Today's Events")).toBeVisible({ timeout: 10000 });

        // 5. Navigate to Profile
        await page.goto('/profile');
        await expect(page).toHaveURL('/profile');

        // 6. Verify Profile Content
        await expect(page.locator('text=MEMBER').first()).toBeVisible();
        await expect(page.locator('text=Tasks Requested')).toBeVisible();
        await expect(page.locator('text=Completed')).toBeVisible();
        await expect(page.locator('text=Last Active')).toBeVisible();

        // 7. Verify No "Access Denied"
        await expect(page.locator('text=Access Denied')).not.toBeVisible();
    });


});
