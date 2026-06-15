import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
    const email = process.env.TEST_ADMIN_EMAIL || 'media@thaibagarden.com';
    const password = process.env.TEST_ADMIN_PASSWORD || 'media@thaiba';
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*home/);
}

export async function loginAsGuest(page: Page) {
    const email = process.env.TEST_GUEST_EMAIL || 'shuaibmse007@gmail.com';
    const password = process.env.TEST_GUEST_PASSWORD || 'amarthaiba@thaiba';
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*home/);
}
