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
  // Clear browser storage/cache
  await page.context().clearCookies();
  
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
  await page.goto(`${baseUrl}/login`);
  
  // Check if we are running in mocked Firebase mode in CI
  if (process.env.MOCK_FIREBASE === 'true') {
    // Use playwright_test_auth to bypass login
    await page.evaluate((r) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('mediahive_onboarding_complete', 'true');
      localStorage.setItem('hasSeenMemberWelcome-v1', 'true');
      localStorage.setItem('playwright_test_auth', 'true');
      localStorage.setItem('playwright_test_role', r);
    }, role);

    try {
      await page.goto(`${baseUrl}/home`);
    } catch (e: any) {
      if (!e.message.includes('ERR_ABORTED') && !e.message.includes('NS_BINDING_ABORTED') && !e.message.includes('NS_ERROR_FAILURE')) throw e;
    }
  } else {
    // We are running tests locally with real DB
    const { email, password } = getCredentials(role);

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
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
  }

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
