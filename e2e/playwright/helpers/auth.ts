import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/'); // Need to navigate to a same-origin URL before modifying localStorage
  await page.evaluate(() => {
    localStorage.setItem('playwright_test_auth', 'true');
    // Set appropriate role if needed by app
    localStorage.setItem('playwright_test_role', 'admin');
  });
  await page.reload();
}

export async function loginAsGuest(page: Page) {
  await page.goto('/'); // Need to navigate to a same-origin URL before modifying localStorage
  await page.evaluate(() => {
    localStorage.setItem('playwright_test_auth', 'true');
    localStorage.setItem('playwright_test_role', 'guest');
  });
  await page.reload();
}
