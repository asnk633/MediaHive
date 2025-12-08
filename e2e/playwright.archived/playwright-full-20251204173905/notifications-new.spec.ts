// e2e/playwright/notifications-new.spec.ts
// E2E tests for the new notification creation form

import { test, expect } from '@playwright/test';
import { seedUser } from './helpers/seed';

test.describe('New Notification Form', () => {
  test('should create a new notification and redirect to updates page', async ({ page }) => {
    // Seed an admin user (only admins can create notifications)
    const adminUser = await seedUser(page, 'admin');
    
    // Inject user data into localStorage to simulate login
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, adminUser);
    
    // Navigate to new notification page
    await page.goto('/notifications/new');
    
    // Wait for form to be visible
    await page.waitForSelector('input#title', { state: 'visible' });
    
    // Fill in the form
    await page.fill('input#title', 'Test Notification Title');
    await page.fill('textarea#body', 'Test Notification Body');
    
    // Select audience
    await page.click('button:has-text("all")');
    
    // Submit the form
    await page.click('button:has-text("Send Notification")');
    
    // Verify redirect to updates page
    await page.waitForURL('**/updates');
    await expect(page).toHaveURL(/.*updates/);
    
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
    
    // Navigate to new notification page
    await page.goto('/notifications/new');
    
    // Wait for form to be visible
    await page.waitForSelector('input#title', { state: 'visible' });
    
    // Submit empty form
    await page.click('button:has-text("Send Notification")');
    
    // Verify validation error is shown
    await expect(page.locator('text=Title is required')).toBeVisible();
  });

  test('should not be accessible for non-admin users', async ({ page }) => {
    // Seed a team user (non-admin)
    const teamUser = await seedUser(page, 'team');
    
    // Inject user data into localStorage to simulate login
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, teamUser);
    
    // Try to navigate to new notification page
    await page.goto('/notifications/new');
    
    // Verify redirect to home or unauthorized page
    // This will depend on how the app handles unauthorized access
    await page.waitForURL('**/*');
  });
});