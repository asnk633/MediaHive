import { Page, expect } from '@playwright/test';

export function getCredentials(role: 'admin' | 'guest' | 'member') {
  if (process.env.MOCK_FIREBASE === 'true') {
    return { email: `mock_${role}@example.com`, password: 'password' };
  }
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
  
  const isMock = process.env.MOCK_FIREBASE === 'true';

  // Set onboarding completion and welcome flags
  await page.evaluate(({ roleParam, isMockParam }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('mediahive_onboarding_complete', 'true');
    localStorage.setItem('hasSeenMemberWelcome-v1', 'true');

    // Inject test auth directly in mock environments to bypass UI form
    if (isMockParam) {
      localStorage.setItem('playwright_test_auth', 'true');
      localStorage.setItem('playwright_test_role', roleParam);
    }
  }, { roleParam: role, isMockParam: isMock });

  // Reload to ensure flags are active
  if (isMock) {
    // For mock environment, directly navigate to home because the reload will redirect
    // due to AuthContextProvider bypassing the check if `playwright_test_auth` is set.
    try {
      await page.goto(`${baseUrl}/home`);
    } catch (e: any) {
      if (!e.message.includes('ERR_ABORTED') && !e.message.includes('NS_BINDING_ABORTED')) throw e;
    }
  } else {
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
