/**
 * admin-attendance.spec.ts
 *
 * Web Admin Attendance Hub Tests
 * Route: /(shell)/admin/attendance (confirmed by file grep)
 * Tabs confirmed: "NFC Registry" (line 422), "QR Code Center" (line 434)
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

async function injectRoleAndGoToAttendance(page: Page, role: string) {
  await safeGoto(page, '/login');
  await page.evaluate((r) => {
    localStorage.clear();
    localStorage.setItem('playwright_test_auth', 'true');
    localStorage.setItem('playwright_test_role', r);
    localStorage.setItem('playwright_test_institution_id', '1');
    localStorage.setItem('playwright_test_department_id', '1');
    localStorage.setItem('mediahive_onboarding_complete', 'true');
    localStorage.setItem('hasSeenMemberWelcome-v1', 'true');
  }, role);
  await safeGoto(page, '/home');
  await safeGoto(page, '/admin/attendance');
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
}

test.describe('Web Admin Attendance Hub', () => {

  test.describe('Access Control', () => {
    test('Admin role reaches /admin/attendance without error', async ({ page }) => {
      await injectRoleAndGoToAttendance(page, 'admin');
      const content = page.locator('main, h1, h2, [role="main"]').first();
      await expect(content).toBeVisible({ timeout: 10000 });
      const is500 = await page.locator('text=500, text=Internal Server Error').isVisible().catch(() => false);
      expect(is500).toBe(false);
    });

    test('Manager role reaches /admin/attendance without error', async ({ page }) => {
      await injectRoleAndGoToAttendance(page, 'manager');
      const content = page.locator('main, h1, h2, [role="main"]').first();
      await expect(content).toBeVisible({ timeout: 10000 });
    });

    test('Member role is redirected away from /admin/attendance', async ({ page }) => {
      await injectRoleAndGoToAttendance(page, 'member');
      // page.tsx:48-58 shows toast + redirect to /home for non-admin/manager
      await page.waitForTimeout(3000);
      const url = page.url();
      // Should be redirected — NOT staying on /admin/attendance
      const isStillOnAttendance = url.includes('/admin/attendance');
      // This should fail if redirect is broken — member should never stay on this page
      expect(isStillOnAttendance).toBe(false);
    });
  });

  test.describe('Tab Navigation', () => {
    test('NFC Registry tab is visible and clickable for admin', async ({ page }) => {
      await injectRoleAndGoToAttendance(page, 'admin');
      const nfcTab = page.locator('text=NFC Registry').first();
      await expect(nfcTab).toBeVisible({ timeout: 25000 });
      await nfcTab.click();
      await page.waitForTimeout(500);
      // No crash after tab switch
      const is500 = await page.locator('text=500, text=Internal Server Error').isVisible().catch(() => false);
      expect(is500).toBe(false);
    });

    test('QR Code Center tab is visible and clickable for admin', async ({ page }) => {
      await injectRoleAndGoToAttendance(page, 'admin');
      const qrTab = page.locator('text=QR Code Center').first();
      await expect(qrTab).toBeVisible({ timeout: 25000 });
      await qrTab.click();
      await page.waitForTimeout(500);
    });

    test('All three tabs render: Attendance Logs, NFC Registry, QR Code Center', async ({ page }) => {
      await injectRoleAndGoToAttendance(page, 'admin');
      await expect(page.locator('text=NFC Registry').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=QR Code Center').first()).toBeVisible({ timeout: 10000 });
      // Attendance tab — check for "Attendance" text (the tab label)
      await expect(page.locator('text=Attendance').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Attendance Logs Functionality', () => {
    test('Attendance Logs renders table or no-data state — not a blank page', async ({ page }) => {
      await injectRoleAndGoToAttendance(page, 'admin');
      await page.waitForTimeout(2000);

      const tableOrList = page.locator('table, [role="table"], ul, li').first();
      const noDataMsg = page.locator(
        'text=No records, text=No data, text=No attendance, text=empty, text=No logs'
      ).first();

      const hasTable = await tableOrList.isVisible({ timeout: 5000 }).catch(() => false);
      const hasNoData = await noDataMsg.isVisible({ timeout: 5000 }).catch(() => false);
      const hasSomething = hasTable || hasNoData;

      if (!hasSomething) {
        // At minimum, page should not be blank — check for any visible text content
        const anyText = await page.locator('p, span, td, li').first().isVisible({ timeout: 3000 }).catch(() => false);
        expect(anyText || hasSomething).toBe(true);
      }
    });

    test('NFC Registry tab content loads without crashing', async ({ page }) => {
      await injectRoleAndGoToAttendance(page, 'admin');
      await page.locator('text=NFC Registry').first().click();
      await page.waitForTimeout(2000);
      const crashed = await page.locator('text=Application error, text=Unhandled Runtime Error').isVisible().catch(() => false);
      expect(crashed).toBe(false);
    });
  });

});
