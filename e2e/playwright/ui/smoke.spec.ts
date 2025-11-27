import { test, expect } from '@playwright/test';

test.describe('UI Structure & Navigation Smoke Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Page Error: ${msg.text()}`);
      }
    });
  });

  test('BottomNav has exactly 6 items with correct labels', async ({ page }) => {
    await page.goto('/home');
    const navItems = page.locator('.bottom-nav .nav-item');
    await expect(navItems).toHaveCount(6);

    await expect(navItems.nth(0)).toContainText('Home');
    await expect(navItems.nth(1)).toContainText('Tasks');
    await expect(navItems.nth(2)).toContainText('Events');
    await expect(navItems.nth(3)).toContainText('Reports');
    await expect(navItems.nth(4)).toContainText('Downloads');
    await expect(navItems.nth(5)).toContainText('Profile');
  });

  test('All 6 main pages load with status 200', async ({ page }) => {
    const pages = ['/home', '/tasks', '/events', '/reports', '/downloads', '/profile'];

    for (const path of pages) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      // Basic visibility check to ensure page content loaded
      await expect(page.locator('main, .page, h1').first()).toBeVisible();
    }
  });

  test('FAB opens/closes and shows correct menu items', async ({ page }) => {
    await page.goto('/home');

    // FAB should be visible
    const fab = page.locator('.fab');
    await expect(fab).toBeVisible();

    // Open FAB
    await fab.click();
    const menu = page.locator('#fab-menu');
    await expect(menu).toBeVisible();

    // Check menu items (assuming non-admin or default role shows 2 or 3 items)
    // We check for at least "New Event" and "New Task" which are common to all
    await expect(page.locator('a[href="/events/new"]')).toBeVisible();
    await expect(page.locator('a[href="/tasks/new"]')).toBeVisible();

    // Close FAB via overlay
    await page.locator('.fab-overlay').click({ force: true });
    await expect(menu).not.toBeVisible();
  });

  test('Updates page is accessible via top-right bell only', async ({ page }) => {
    await page.goto('/home');

    // Updates should NOT be in BottomNav
    const navItems = page.locator('.bottom-nav .nav-item');
    const texts = await navItems.allInnerTexts();
    expect(texts.join(' ')).not.toContain('Updates');

    // Click bell icon in TopBar
    const bellBtn = page.locator('button[aria-label="Notifications"]');
    await expect(bellBtn).toBeVisible();
    await bellBtn.click();

    // Verify URL
    await expect(page).toHaveURL(/.*updates/);
  });
});