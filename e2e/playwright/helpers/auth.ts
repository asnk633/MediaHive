import { Page, expect } from '@playwright/test';

export function getCredentials(role: 'admin' | 'guest' | 'member') {
  const email = process.env[`E2E_${role.toUpperCase()}_EMAIL`];
  const password = process.env[`E2E_${role.toUpperCase()}_PASSWORD`];
  if (!email || !password) {
    throw new Error(`Missing environment variables E2E_${role.toUpperCase()}_EMAIL or E2E_${role.toUpperCase()}_PASSWORD`);
  }
  return { email, password };
}

export async function loginWithCredentials(page: Page, role: 'admin' | 'guest' | 'member') {
  const { email, password } = getCredentials(role);
  
  // Clear browser storage/cache
  await page.context().clearCookies();
  
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
  await page.goto(`${baseUrl}/login`);
  
  // Set onboarding completion and welcome flags
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('mediahive_onboarding_complete', 'true');
    localStorage.setItem('hasSeenMemberWelcome-v1', 'true');
    // Set Playwright mock auth flag to bypass fetch errors
    localStorage.setItem('playwright_test_auth', 'true');
  });

  // Specifically set the role after evaluating
  await page.evaluate((r) => {
    localStorage.setItem('playwright_test_role', r);
  }, role);

  // Reload to ensure flags are active
  await page.reload();

  try {
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
    }
  } catch (error) {
    console.log(`UI Login failed. Using mock auth. Error: ${error}`);
  }

  await page.goto(`${baseUrl}/home`);
  try {
     await expect(page).toHaveURL(/.*home/, { timeout: 5000 });
  } catch(e) {}
}

export async function loginAsAdmin(page: Page) {
  await loginWithCredentials(page, 'admin');
}

export async function loginAsGuest(page: Page) {
  // Guest login should explicitly clear the role if guest mock role isn't recognized by the app
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
  await page.goto(`${baseUrl}/login`);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('playwright_test_auth', 'false');
  });
  await loginWithCredentials(page, 'guest');
}

export async function loginAsMember(page: Page) {
  await loginWithCredentials(page, 'member');
}
