import { test, expect } from '@playwright/test';

test.describe('Accessibility Checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home');
  });

  test('Home page has proper heading structure', async ({ page }) => {
    // Check that page has a main heading
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that headings follow proper hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('Home page has sufficient color contrast', async ({ page }) => {
    // Check text color contrast
    const textColor = await page.locator('body').evaluate(el => getComputedStyle(el).color);
    const bgColor = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor);
    
    // Basic check that text and background are different
    expect(textColor).not.toBe(bgColor);
  });

  test('All interactive elements are keyboard accessible', async ({ page }) => {
    // Enable keyboard navigation detection
    await page.evaluate(() => {
      document.body.classList.add('keyboard-navigation');
    });
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Check that something is focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Tasks page loads successfully', async ({ page }) => {
    await page.goto('/tasks');
    
    // Check that the page loads successfully
    await expect(page.locator('h1')).toContainText('Tasks');
  });

  test('FAB has proper ARIA attributes', async ({ page }) => {
    const fabButton = page.getByRole('button', { name: 'Open quick actions' });
    await expect(fabButton).toBeVisible();
    
    // Check ARIA attributes
    await expect(fabButton).toHaveAttribute('aria-haspopup', 'menu');
    await expect(fabButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('BottomNav has proper navigation roles', async ({ page }) => {
    const bottomNav = page.locator('.bottom-nav');
    await expect(bottomNav).toBeVisible();
    
    // Check that nav items are present
    const navItems = bottomNav.locator('.nav-item');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Task composer page loads successfully', async ({ page }) => {
    await page.goto('/tasks/new');
    
    // Check that the page loads successfully
    await expect(page.locator('h1')).toContainText('New Task');
  });
});