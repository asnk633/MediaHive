import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('playwright_test_auth', 'true');
    localStorage.setItem('playwright_test_role', 'admin');
    localStorage.setItem('mediahive_onboarding_complete', 'true');
  });
  await page.goto('/home');
}

export async function loginAsGuest(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('playwright_test_auth', 'true');
    localStorage.setItem('playwright_test_role', 'guest');
    localStorage.setItem('mediahive_onboarding_complete', 'true');
  });
  await page.goto('/home');
}
