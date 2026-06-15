import { Page } from '@playwright/test';

// Use environment variables for credentials where possible to avoid hardcoding secrets
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'media@thaibagarden.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'media@thaiba';
const GUEST_EMAIL = process.env.GUEST_EMAIL || 'shuaibmse007@gmail.com';
const GUEST_PASSWORD = process.env.GUEST_PASSWORD || 'amarthaiba@thaiba';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for navigation after login
  await page.waitForURL(/.*home/);
}

export async function loginAsGuest(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));

  await page.fill('input[type="email"]', GUEST_EMAIL);
  await page.fill('input[type="password"]', GUEST_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL(/.*home/);
}
