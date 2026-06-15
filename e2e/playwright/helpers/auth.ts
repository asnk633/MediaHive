import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
    await page.fill('input[type="email"]', process.env.ADMIN_EMAIL || 'media@thaibagarden.com');
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD as string);
    await page.click('button[type="submit"]');
    await page.waitForURL('/home', { timeout: 30000 });
}

export async function loginAsGuest(page: Page) {
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
    await page.fill('input[type="email"]', process.env.GUEST_EMAIL || 'shuaibmse007@gmail.com');
    await page.fill('input[type="password"]', process.env.GUEST_PASSWORD as string);
    await page.click('button[type="submit"]');
    await page.waitForURL('/home', { timeout: 30000 });
}
