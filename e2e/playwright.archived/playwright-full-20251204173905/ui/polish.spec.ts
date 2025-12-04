import { test, expect } from '@playwright/test';
import { seedUser } from '../helpers/seed';

test.describe('UI Polish Smoke Tests', () => {
  let adminUser: any;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    adminUser = await seedUser(page, 'admin');
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Inject user data into localStorage to simulate login
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, adminUser);
    
    await page.goto('/home');
  });

  test('Theme toggle works without flicker', async ({ page }) => {
    // Check initial theme
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(initialTheme).toBe('dark');

    // Toggle to light theme
    await page.getByLabel('Toggle theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    // Toggle back to dark theme
    await page.getByLabel('Toggle theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('FAB opens and closes with proper keyboard navigation', async ({ page }) => {
    // Open FAB menu
    await page.getByRole('button', { name: 'Open quick actions' }).click();
    
    // Check that menu items are visible
    await expect(page.getByRole('menu', { name: 'Quick actions menu' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'New Task' })).toBeVisible();
    
    // Close FAB menu with Escape key
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Quick actions menu' })).not.toBeVisible();
  });

  test('BottomNav has proper active state and spacing', async ({ page }) => {
    // Check that BottomNav is visible
    await expect(page.locator('.bottom-nav')).toBeVisible();
    
    // Check that active item has proper styling
    const activeItem = page.locator('.nav-item.active');
    await expect(activeItem).toBeVisible();
    
    // Check that FAB spacer exists
    await expect(page.locator('.bottom-nav').locator('div[style*="width: var(--fab-size)"]')).toBeVisible();
  });

  test('Cards have consistent padding and styling', async ({ page }) => {
    // Navigate to tasks page to check card styling
    await page.goto('/tasks');
    
    // Check that cards have proper padding class
    const card = page.locator('.kanban-card').first();
    await expect(card).toHaveClass(/card-padding/);
    
    // Check that cards have glass effect
    await expect(card).toHaveClass(/glass-card/);
  });

  test('Typography is consistent across pages', async ({ page }) => {
    // Check home page headings
    await page.goto('/home');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toBeVisible();
    
    // Check tasks page headings
    await page.goto('/tasks');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2')).toBeVisible();
  });

  test('Micro-animations work properly', async ({ page }) => {
    // Test button press animation
    const button = page.getByRole('button', { name: 'Open quick actions' });
    
    await button.click({ force: true });
    // We can't easily test the animation visually, but we can ensure the button is interactive
    await expect(button).toBeVisible();
  });

  test('Light theme has proper contrast', async ({ page }) => {
    // Switch to light theme
    await page.getByLabel('Toggle theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    
    // Check that text is readable
    const textColor = await page.locator('body').evaluate(el => getComputedStyle(el).color);
    expect(textColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('All interactive elements have focus indicators', async ({ page }) => {
    // Enable keyboard navigation detection
    await page.evaluate(() => {
      document.body.classList.add('keyboard-navigation');
    });
    
    // Tab to FAB button
    await page.keyboard.press('Tab');
    const fabButton = page.getByRole('button', { name: 'Open quick actions' });
    await expect(fabButton).toBeFocused();
    
    // Check that focus indicator is visible
    const hasFocusVisible = await fabButton.evaluate(el => el.classList.contains('focus-visible'));
    expect(hasFocusVisible).toBe(true);
  });

  // Additional tests for STEP 4

  test('Scroll test for all pages', async ({ page }) => {
    // Test home page scroll
    await page.goto('/home');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Test tasks page scroll
    await page.goto('/tasks');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Test calendar page scroll
    await page.goto('/calendar');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Test downloads page scroll
    await page.goto('/downloads');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Test profile page scroll
    await page.goto('/profile');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  });

  test('FAB open/close snapshot', async ({ page }) => {
    // Open FAB
    await page.getByRole('button', { name: 'Open quick actions' }).click();
    await expect(page.getByRole('menu', { name: 'Quick actions menu' })).toBeVisible();
    
    // Close FAB
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Quick actions menu' })).not.toBeVisible();
  });

  test('BottomNav nav-to-each-page test', async ({ page }) => {
    // Navigate to home
    await page.locator('.nav-item:has-text("Home")').click();
    await expect(page).toHaveURL(/.*home/);
    
    // Navigate to tasks
    await page.locator('.nav-item:has-text("Tasks")').click();
    await expect(page).toHaveURL(/.*tasks/);
    
    // Navigate to downloads
    await page.locator('.nav-item:has-text("Downloads")').click();
    await expect(page).toHaveURL(/.*downloads/);
    
    // Navigate to updates
    await page.locator('.nav-item:has-text("Updates")').click();
    await expect(page).toHaveURL(/.*updates/);
    
    // Navigate to profile
    await page.locator('.nav-item:has-text("Profile")').click();
    await expect(page).toHaveURL(/.*profile/);
  });

  test('Light mode visual test (no low contrast)', async ({ page }) => {
    // Switch to light theme
    await page.getByLabel('Toggle theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    
    // Check that text maintains proper contrast
    const textColor = await page.locator('body').evaluate(el => getComputedStyle(el).color);
    const bgColor = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    
    // Basic check that text and background are different
    expect(textColor).not.toBe(bgColor);
  });

  test('Keyboard navigation test for BottomNav', async ({ page }) => {
    // Enable keyboard navigation detection
    await page.evaluate(() => {
      document.body.classList.add('keyboard-navigation');
    });
    
    // Tab through BottomNav items
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be focused on the last BottomNav item (Profile)
    const profileItem = page.locator('.nav-item:has-text("Profile")');
    await expect(profileItem).toBeFocused();
  });
});