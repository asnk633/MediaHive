// e2e/playwright/tasks-new.spec.ts
// E2E tests for the new task creation form

import { test, expect } from '@playwright/test';
import { seedUser } from './helpers/seed';

test.describe('New Task Form', () => {
  test('should create a new task and redirect to tasks page', async ({ page }) => {
    // Seed an admin user
    const adminUser = await seedUser(page, 'admin');
    
    // Inject user data into localStorage to simulate login
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, adminUser);
    
    // Navigate to new task page
    await page.goto('/tasks/new');
    
    // Wait for form to be visible
    await page.waitForSelector('[data-testid="task-title-input"]', { state: 'visible' });
    
    // Fill in the form
    await page.fill('[data-testid="task-title-input"]', 'Test Task Title');
    await page.fill('textarea#description', 'Test Task Description');
    
    // Select priority
    await page.click('[data-testid="task-priority-select-trigger"]');
    await page.click('div[role="option"]:has-text("High")');
    
    // Submit the form
    await page.click('button:has-text("Create Task")');
    
    // Verify redirect to tasks page
    await page.waitForURL('**/tasks');
    await expect(page).toHaveURL(/.*tasks/);
    
    // Verify success toast (if we can locate it)
    // This might need adjustment based on how toasts are implemented
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    // Seed an admin user
    const adminUser = await seedUser(page, 'admin');
    
    // Inject user data into localStorage to simulate login
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, adminUser);
    
    // Navigate to new task page
    await page.goto('/tasks/new');
    
    // Wait for form to be visible
    await page.waitForSelector('[data-testid="task-title-input"]', { state: 'visible' });
    
    // Submit empty form
    await page.click('button:has-text("Create Task")');
    
    // Verify validation error is shown
    await expect(page.locator('text=Title must be at least 3 characters')).toBeVisible();
  });

  test('should hide restricted fields for guest users', async ({ page }) => {
    // Seed a guest user
    const guestUser = await seedUser(page, 'guest');
    
    // Inject user data into localStorage to simulate login
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, guestUser);
    
    // Navigate to new task page
    await page.goto('/tasks/new');
    
    // Wait for form to be visible
    await page.waitForSelector('[data-testid="task-title-input"]', { state: 'visible' });
    
    // Verify guest users don't see priority field
    await expect(page.locator('label:has-text("Priority")')).not.toBeVisible();
    
    // Verify guest users don't see assign to field
    await expect(page.locator('label:has-text("Assign To")')).not.toBeVisible();
  });
});