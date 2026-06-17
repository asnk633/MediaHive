import { test, expect } from '@playwright/test';
import { safeGoto } from './helpers/navigation';
import { loginAsAdmin, loginAsGuest, loginAsMember } from './helpers/auth';

test.describe('Manager Analytics Dashboard', () => {

  test('Admin can access Manager Analytics and see components', async ({ page }) => {
    // The instructions say to use loginAsAdmin. If global setup is failing, it's not the test's fault.
    // I should write the test as instructed.
    await loginAsAdmin(page);
    await safeGoto(page, '/manager-analytics');

    // Wait for the page to load by checking for a heading
    const heading = page.locator('h1, h2', { hasText: /analytics|manager/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify Recharts visual components render (generic SVGs or specific recharts container)
    // We check for svg elements that are likely part of recharts, or the recharts-wrapper itself
    const charts = page.locator('svg.recharts-surface, .recharts-wrapper, svg');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);

    // Verify Velocity tracking widget shows metrics
    const velocityWidget = page.locator('text=/velocity/i').first();
    await expect(velocityWidget).toBeVisible();
  });

  test('Guest is denied access to Manager Analytics', async ({ page }) => {
    await loginAsGuest(page);
    await safeGoto(page, '/manager-analytics');

    // Verify redirect or access denied message
    const url = page.url();
    const isRedirected = !url.includes('/manager-analytics') || url.includes('/login') || url.includes('/home') || url.includes('/dashboard');

    if (!isRedirected) {
      const accessDenied = page.locator('text=/access denied|unauthorized|forbidden/i').first();
      await expect(accessDenied).toBeVisible({ timeout: 15000 });
    } else {
      expect(isRedirected).toBe(true);
    }
  });

  test('Standard Member is denied access to Manager Analytics', async ({ page }) => {
    await loginAsMember(page);
    await safeGoto(page, '/manager-analytics');

    // Verify redirect or access denied message
    const url = page.url();
    const isRedirected = !url.includes('/manager-analytics') || url.includes('/login') || url.includes('/home') || url.includes('/dashboard');

    if (!isRedirected) {
      const accessDenied = page.locator('text=/access denied|unauthorized|forbidden/i').first();
      await expect(accessDenied).toBeVisible({ timeout: 15000 });
    } else {
      expect(isRedirected).toBe(true);
    }
  });
});
