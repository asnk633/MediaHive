import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest } from './helpers/auth';
import { safeGoto } from './helpers/navigation';

test.describe('User Management', () => {

  test('Users list page loads', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);
    
    // Navigate using safeGoto
    // The requirement mentions safeGoto('/users') or '/admin/users'
    await safeGoto(page, '/admin/users');
    
    // Verify that we are on the correct page (heading or URL)
    await expect(page).toHaveURL(/.*admin\/users/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible();
  });

  test('User count >= 1', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/admin/users');

    // Wait for the main user list/table to appear
    await page.waitForSelector('svg.animate-spin', { state: 'detached', timeout: 15000 });

    // Check that we have user buttons rendered in the scrollable list
    const userButtons = page.locator('div.overflow-y-auto button');
    await expect(userButtons.first()).toBeVisible({ timeout: 15000 });

    // Verify count >= 1
    const count = await userButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('View own profile details', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/admin/users');

    await page.waitForSelector('svg.animate-spin', { state: 'detached', timeout: 15000 });
    
    const userButtons = page.locator('div.overflow-y-auto button');

    // Click the first user profile
    await userButtons.first().click();

    // Verify detail view loads
    const detailPanel = page.locator('div.glass-liquid');
    await expect(detailPanel).toBeVisible({ timeout: 15000 });

    // Check that profile avatar/name elements exist in the details
    await expect(detailPanel.locator('div.w-32.h-32')).toBeVisible();
  });

  test('Profile shows correct role badge', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/admin/users');

    await page.waitForSelector('svg.animate-spin', { state: 'detached', timeout: 15000 });

    // Select a user to view profile details
    const userButtons = page.locator('div.overflow-y-auto button');
    await userButtons.first().click();

    // Wait for details panel
    const detailPanel = page.locator('div.glass-liquid');
    await expect(detailPanel).toBeVisible({ timeout: 15000 });

    // Look for role badge indicating Administrator or Global access
    // From page.tsx we know it says "Global" or "Administrator"
    const roleBadge = detailPanel.locator('button:has-text("Global"), button:has-text("Admin")').first();
    await expect(roleBadge).toBeVisible({ timeout: 15000 });
  });

  test('Guest sees limited user list or restricted access depending on RBAC rules', async ({ page }) => {
    await loginAsGuest(page);

    // Try to access /admin/users directly
    await safeGoto(page, '/admin/users');

    // Guest should be redirected back to home or a forbidden page
    await expect(page).toHaveURL(/.*home/, { timeout: 15000 });
  });
});
