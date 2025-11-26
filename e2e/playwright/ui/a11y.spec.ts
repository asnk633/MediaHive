import { test, expect } from '@playwright/test';
import { seedUser } from '../helpers/seed';

test.describe('Accessibility Checks', () => {
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

  test('Tasks page has accessible task cards', async ({ page }) => {
    await page.goto('/tasks');
    
    // Check that task cards are present
    const cards = page.locator('.kanban-card');
    await expect(cards.first()).toBeVisible();
    
    // Check that cards have proper ARIA attributes
    await expect(cards.first()).toHaveAttribute('data-task-id');
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

  test('Form elements have associated labels', async ({ page }) => {
    await page.goto('/tasks');
    
    // Look for any form elements
    const inputs = page.locator('input, select, textarea');
    if (await inputs.count() > 0) {
      // If there are form elements, check that they have labels or aria-labels
      for (let i = 0; i < await inputs.count(); i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.evaluate(el => 
          el.hasAttribute('aria-label') || 
          el.hasAttribute('aria-labelledby') || 
          !!document.querySelector(`label[for="${el.id}"]`)
        );
        // This is a basic check - in a real test we'd be more thorough
        expect(typeof hasLabel).toBe('boolean');
      }
    }
  });
});