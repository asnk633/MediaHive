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
  });

  // Reload to ensure flags are active
  await page.reload();

  // Fill credentials and login
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for home page navigation
  await expect(page).toHaveURL(/.*home/, { timeout: 30000 });
}

export async function loginAsAdmin(page: Page) {
  await loginWithCredentials(page, 'admin');
}

export async function loginAsGuest(page: Page) {
  await loginWithCredentials(page, 'guest');
}

export async function loginAsMember(page: Page) {
  await loginWithCredentials(page, 'member');
}
