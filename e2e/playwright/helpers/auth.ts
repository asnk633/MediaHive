import { Page, expect } from '@playwright/test';

export function getCredentials(role: 'admin' | 'guest' | 'member') {
  const email = process.env[`E2E_${role.toUpperCase()}_EMAIL`] || 'mock@test.com';
  const password = process.env[`E2E_${role.toUpperCase()}_PASSWORD`] || 'password';
  return { email, password };
}

export async function loginWithCredentials(page: Page, role: 'admin' | 'guest' | 'member') {
  const { email, password } = getCredentials(role);
  
  // Clear browser storage/cache
  await page.context().clearCookies();
  
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
  await page.goto(`${baseUrl}/login`);
  
  // Set onboarding completion and welcome flags
  await page.evaluate((r) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('playwright_test_auth', 'true');
    localStorage.setItem('playwright_test_role', r);
    localStorage.setItem('mediahive_onboarding_complete', 'true');
    localStorage.setItem('hasSeenMemberWelcome-v1', 'true');
  }, role);

  // Reload to ensure flags are active
  await page.reload();

  // Fill credentials and login

  // We mock authentication via localStorage, so no need to fill the form.
  // Instead, just navigate to the home page or trigger reload if needed.


  // Wait for home page navigation

  // We mock authentication via localStorage, so no need to fill the form.
  // Instead, just navigate to the home page or trigger reload if needed.
  await page.goto(baseUrl + '/home');
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
