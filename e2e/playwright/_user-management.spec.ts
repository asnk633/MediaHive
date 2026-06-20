import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest } from './helpers/auth';
import { safeGoto } from './helpers/navigation';

test.describe('User Management', () => {
  test('Users page redirects or loads admin users page for admin', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/users');
    
    // Check that we redirected to /admin/users or loaded the user list
    await expect(page).toHaveURL(/.*admin\/users/, { timeout: 15000 });
    
    // Verify the page heading is visible
    await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible();
  });

  test('Admin users page loads list with at least one user', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/admin/users');

    // Wait for loader to disappear if there is one
    await page.waitForSelector('svg.animate-spin', { state: 'detached', timeout: 15000 });

    // Verify Active Users tab is selected
    await expect(page.getByRole('button', { name: /Active Users/i })).toBeVisible();

    // Verify there is at least one user card/button in the left panel list.
    const userButtons = page.locator('div.overflow-y-auto button');
    await expect(userButtons.first()).toBeVisible({ timeout: 15000 });
    const count = await userButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Admin can view user details and check role badge', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/admin/users');

    // Wait for user list to load
    await page.waitForSelector('svg.animate-spin', { state: 'detached', timeout: 15000 });
    
    // Click on the first user to view details in the detail panel (right panel)
    const userButtons = page.locator('div.overflow-y-auto button');
    await userButtons.first().click();

    // Wait for the detail panel to load and show the role badge
    const detailPanel = page.locator('div.glass-liquid');
    await expect(detailPanel).toBeVisible();

    // Check if the role badge containing "Global" is visible inside the detail panel
    await expect(detailPanel.locator('button:has-text("Global")')).toBeVisible({ timeout: 15000 });
  });

  test('Guest is redirected or blocked from accessing User Management', async ({ page }) => {
    await loginAsGuest(page);
    await safeGoto(page, '/admin/users');

    // Guest should be redirected to /home
    await expect(page).toHaveURL(/.*home/, { timeout: 15000 });
  });
});
