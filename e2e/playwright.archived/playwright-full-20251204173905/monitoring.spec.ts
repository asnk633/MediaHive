// e2e/playwright/monitoring.spec.ts
// Tests for admin monitoring functionality

import { test, expect } from '@playwright/test';
import { seedUser, seedTask } from './helpers/seed';

test.describe('Admin Monitoring', () => {
  test('should display monitoring dashboard for admin users', async ({ page }) => {
    // Seed admin user
    const admin = await seedUser(page, 'admin');

    // Login admin
    await page.addInitScript((admin) => {
      window.localStorage.setItem('user', JSON.stringify(admin));
    }, admin);

    // Navigate to monitoring dashboard
    await page.goto('/admin/monitoring');

    // Wait for monitoring dashboard to load
    await page.waitForSelector('[data-testid="monitoring-dashboard"]', { state: 'visible' });

    // Verify monitoring dashboard is displayed
    await expect(page.locator('[data-testid="monitoring-dashboard"]')).toBeVisible();
    await expect(page.locator('h2')).toHaveText('Admin Monitoring Dashboard');
  });

  test('should show SSE connection status', async ({ page }) => {
    // Seed admin user
    const admin = await seedUser(page, 'admin');

    // Login admin
    await page.addInitScript((admin) => {
      window.localStorage.setItem('user', JSON.stringify(admin));
    }, admin);

    // Navigate to monitoring dashboard
    await page.goto('/admin/monitoring');

    // Wait for monitoring dashboard to load
    await page.waitForSelector('[data-testid="monitoring-dashboard"]', { state: 'visible' });

    // Verify SSE status badge is displayed
    await expect(page.locator('[data-testid="sse-status-badge"]')).toBeVisible();
    
    // Verify connection status text
    const statusText = await page.locator('[data-testid="sse-status-badge"] .status-text').textContent();
    expect(statusText).toMatch(/Connected|Disconnected/);
  });

  test('should display monitoring metrics', async ({ page }) => {
    // Seed admin user
    const admin = await seedUser(page, 'admin');

    // Login admin
    await page.addInitScript((admin) => {
      window.localStorage.setItem('user', JSON.stringify(admin));
    }, admin);

    // Navigate to monitoring dashboard
    await page.goto('/admin/monitoring');

    // Wait for monitoring dashboard to load
    await page.waitForSelector('[data-testid="monitoring-dashboard"]', { state: 'visible' });

    // Verify monitoring cards are displayed
    await expect(page.locator('.monitoring-card')).toHaveCount(3);
    
    // Verify metric titles
    await expect(page.locator('.monitoring-card h3')).toHaveText([
      'Online Users',
      'Active Editors',
      'Active Locks'
    ]);
    
    // Verify metric values are displayed
    await expect(page.locator('.metric-value')).toHaveCount(3);
  });

  test('should reject non-admin users from accessing monitoring dashboard', async ({ page }) => {
    // Seed non-admin user
    const user = await seedUser(page, 'team');

    // Login user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Try to navigate to monitoring dashboard
    const response = await page.goto('/admin/monitoring');
    
    // Verify access is denied (should redirect or show 401)
    expect(response?.status()).toBe(401);
  });
});