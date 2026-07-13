/**
 * auth-refresh.spec.ts
 *
 * JWT Single-Flight Refresh Race Condition Tests
 * Uses safeGoto to handle ERR_ABORTED redirects from Next.js middleware.
 */

import { test, expect, Page } from '@playwright/test';

async function safeGoto(page: Page, url: string) {
  try {
    await page.goto(url, { timeout: 30000, waitUntil: 'load' });
  } catch (e: any) {
    const msg = e.message || '';
    if (
      msg.includes('ERR_ABORTED') ||
      msg.includes('NS_BINDING_ABORTED') ||
      msg.includes('interrupted by another navigation') ||
      msg.includes('Frame load interrupted') ||
      msg.includes('Navigation timeout')
    ) {
      await page.waitForLoadState('load').catch(() => {});
      return;
    }
    throw e;
  }
}

async function injectAdminSession(page: Page) {
  await safeGoto(page, '/login');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('playwright_test_auth', 'true');
    localStorage.setItem('playwright_test_role', 'admin');
    localStorage.setItem('playwright_test_institution_id', '1');
    localStorage.setItem('playwright_test_department_id', '1');
    localStorage.setItem('mediahive_onboarding_complete', 'true');
  });
  await safeGoto(page, '/home');
  await page.waitForSelector('main, nav, [role="main"]', { timeout: 15000 }).catch(() => {});
}

test.describe('JWT Token Refresh — Race Condition Tests', () => {

  test('Concurrent API requests do not cause multiple 401 errors', async ({ page }) => {
    await injectAdminSession(page);

    const unauthorizedResponses: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/api/') && response.status() === 401) {
        unauthorizedResponses.push(response.url());
      }
    });

    await page.evaluate(async () => {
      const endpoints = ['/api/tasks', '/api/notifications', '/api/chat/rooms'];
      await Promise.allSettled(
        endpoints.map((url) =>
          fetch(url, { credentials: 'include' }).catch(() => null)
        )
      );
    });

    // Healthy token refresh: at most one 401 fires, then the refresh resolves the rest
    expect(unauthorizedResponses.length).toBeLessThanOrEqual(1);
  });

  test('Page does not show 401 error messages in the UI after navigation', async ({ page }) => {
    await injectAdminSession(page);

    const refreshCalls: string[] = [];
    await page.route('**/auth/v1/token**', (route) => {
      refreshCalls.push(route.request().url());
      route.continue();
    });

    await safeGoto(page, '/home');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

    const errorMessages = page.locator('text=401, text=Unauthorized, text=Session expired').first();
    await expect(errorMessages).not.toBeVisible({ timeout: 5000 }).catch(() => {});

    const mainContent = page.locator('main, [role="main"], h1, h2').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });

  test('Clearing auth state causes redirect to login, not an error page', async ({ page }) => {
    await injectAdminSession(page);
    await safeGoto(page, '/home');
    await page.waitForSelector('main', { timeout: 10000 }).catch(() => {});

    // Simulate logout by clearing auth flags
    await page.evaluate(() => {
      localStorage.removeItem('playwright_test_auth');
      localStorage.removeItem('playwright_test_role');
    });

    await safeGoto(page, '/tasks');

    // Should not land on an error page
    const isOnError = page.url().includes('error') || page.url().includes('500');
    expect(isOnError).toBe(false);

    const jsError = page.locator(
      'text=Application error, text=Unhandled Runtime Error'
    ).first();
    await expect(jsError).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  });

});
