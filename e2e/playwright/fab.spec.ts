// e2e/playwright/fab.spec.ts
// Tests for the FAB component with role-based visibility

import { test, expect } from '@playwright/test';
import { seedUser } from './helpers/seed';

test.describe('FAB Component', () => {
  test('should show Notify button only for Admin role', async ({ page }) => {
    // Seed an admin user
    const adminUser = await seedUser(page, 'admin');
    
    // Inject user data into localStorage to simulate login
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, adminUser);
    
    // Navigate to tasks page
    await page.goto('/tasks');
    
    // Wait for FAB to be visible
    await page.waitForSelector('[data-testid="fab-open"]', { state: 'visible' });
    
    // Click FAB to open menu
    await page.click('[data-testid="fab-open"]');
    
    // Verify all buttons are visible for admin
    await expect(page.locator('[data-testid="fab-new-task"]')).toBeVisible();
    await expect(page.locator('[data-testid="fab-new-event"]')).toBeVisible();
    await expect(page.locator('[data-testid="fab-notify"]')).toBeVisible();
  });

  test('should not show Notify button for Team role', async ({ page }) => {
    // Seed a team user
    const teamUser = await seedUser(page, 'team');
    
    // Inject user data into localStorage to simulate login
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, teamUser);
    
    // Navigate to tasks page
    await page.goto('/tasks');
    
    // Wait for FAB to be visible
    await page.waitForSelector('[data-testid="fab-open"]', { state: 'visible' });
    
    // Click FAB to open menu
    await page.click('[data-testid="fab-open"]');
    
    // Verify team-specific buttons are visible
    await expect(page.locator('[data-testid="fab-new-task"]')).toBeVisible();
    await expect(page.locator('[data-testid="fab-new-event"]')).toBeVisible();
    
    // Verify Notify button is not visible for team
    await expect(page.locator('[data-testid="fab-notify"]')).not.toBeVisible();
  });

  test('should show only New Task for Guest role', async ({ page }) => {
    // Seed a guest user
    const guestUser = await seedUser(page, 'guest');
    
    // Inject user data into localStorage to simulate login
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, guestUser);
    
    // Navigate to tasks page
    await page.goto('/tasks');
    
    // Wait for FAB to be visible
    await page.waitForSelector('[data-testid="fab-open"]', { state: 'visible' });
    
    // Click FAB to open menu
    await page.click('[data-testid="fab-open"]');
    
    // Verify only New Task is visible for guest
    await expect(page.locator('[data-testid="fab-new-task"]')).toBeVisible();
    await expect(page.locator('[data-testid="fab-new-event"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="fab-notify"]')).not.toBeVisible();
  });

  test('should close FAB menu when clicking outside', async ({ page }) => {
    // Seed an admin user
    const adminUser = await seedUser(page, 'admin');
    
    // Inject user data into localStorage to simulate login
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, adminUser);
    
    // Navigate to tasks page
    await page.goto('/tasks');
    
    // Wait for FAB to be visible
    await page.waitForSelector('[data-testid="fab-open"]', { state: 'visible' });
    
    // Click FAB to open menu
    await page.click('[data-testid="fab-open"]');
    
    // Verify menu is open
    await expect(page.locator('[data-testid="fab-new-task"]')).toBeVisible();
    
    // Click outside the menu
    await page.click('body', { position: { x: 0, y: 0 } });
    
    // Verify menu is closed
    await expect(page.locator('[data-testid="fab-new-task"]')).not.toBeVisible();
  });
});