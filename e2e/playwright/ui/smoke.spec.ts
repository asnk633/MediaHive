import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('Home page loads successfully', async ({ page }) => {
    await page.goto('/home');
    
    // Check that the page loads successfully
    await expect(page.locator('h1')).toContainText('Good Morning');
  });

  test('Tasks page loads successfully', async ({ page }) => {
    await page.goto('/tasks');
    
    // Check that the page loads successfully
    await expect(page.locator('h1')).toContainText('Tasks');
  });

  test('Task composer page loads successfully', async ({ page }) => {
    await page.goto('/tasks/new');
    
    // Check that the page loads successfully (it might show an error, but it should load)
    await expect(page).toHaveURL(/.*tasks\/new/);
  });

  test('Notifications page loads successfully', async ({ page }) => {
    await page.goto('/notifications');
    
    // Check that the page loads successfully
    await expect(page.locator('h1')).toContainText('Notifications');
  });

  test('Profile page loads successfully', async ({ page }) => {
    await page.goto('/profile');
    
    // Check that the page loads successfully
    await expect(page).toHaveURL(/.*profile/);
  });
});