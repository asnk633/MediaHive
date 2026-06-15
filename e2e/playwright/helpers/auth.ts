import { Page, expect } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
  await page.fill('input[type="email"]', 'media@thaibagarden.com');
  await page.fill('input[type="password"]', 'media@thaiba');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*home|.*tasks/, { timeout: 10000 });
}

export async function loginAsGuest(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
  await page.fill('input[type="email"]', 'guest@example.com'); // We will use generic user or test it similarly
  await page.fill('input[type="password"]', 'guest123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*home|.*tasks/, { timeout: 10000 });
}
