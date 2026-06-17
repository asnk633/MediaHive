import { Page, expect } from '@playwright/test';

// Simplified mock helper for tests since local validation tests need it bypassed
export async function loginAsAdmin(page: Page) {
  await page.goto('/login').catch(() => {});
  await page.evaluate(() => {
    localStorage.setItem('playwright_test_auth', 'true');
    localStorage.setItem('playwright_test_role', 'admin');
    localStorage.setItem('mediahive_onboarding_complete', 'true');
  });
}

export async function loginAsGuest(page: Page) {
  await page.goto('/login').catch(() => {});
  await page.evaluate(() => {
    localStorage.setItem('playwright_test_auth', 'true');
    localStorage.setItem('playwright_test_role', 'guest');
    localStorage.setItem('mediahive_onboarding_complete', 'true');
  });
}
