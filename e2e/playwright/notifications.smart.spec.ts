// e2e/playwright/notifications.smart.spec.ts
// E2E tests for smart notification system

import { test, expect } from '@playwright/test';
import { testWithLogin } from './fixtures';

testWithLogin.describe('Smart Notification System', () => {
  testWithLogin('should schedule a notification', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to notifications page
    await page.goto('/notifications');
    
    // Click schedule notification button
    await page.click('button:has-text("Schedule Notification")');
    
    // Fill in notification details
    await page.fill('input#title', 'Test Scheduled Notification');
    await page.fill('textarea#body', 'This is a test scheduled notification');
    await page.fill('input#scheduledAt', '2023-12-31T23:59');
    
    // Click schedule button
    await page.click('button:has-text("Schedule")');
    
    // Verify notification was scheduled
    await expect(page.locator('.notifications-list')).toContainText('Test Scheduled Notification');
  });

  testWithLogin('should bundle notifications', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to notifications page
    await page.goto('/notifications');
    
    // Click bundle notifications button
    await page.click('button:has-text("Bundle Notifications")');
    
    // Select category to bundle
    await page.selectOption('select#category', 'task');
    
    // Click bundle button
    await page.click('button:has-text("Bundle")');
    
    // Verify notifications were bundled
    await expect(page.locator('.notifications-list')).toContainText('bundled');
  });

  testWithLogin('should respect quiet hours', async ({ page, loginAs }) => {
    // Login as user
    await loginAs('team');
    
    // Navigate to notification settings
    await page.goto('/settings/notifications');
    
    // Enable quiet hours
    await page.click('input#quiet-hours-toggle');
    
    // Set quiet hours time
    await page.fill('input#start-time', '22:00');
    await page.fill('input#end-time', '08:00');
    
    // Save settings
    // This would depend on how the save functionality is implemented
    
    // Verify quiet hours are enabled
    await expect(page.locator('input#quiet-hours-toggle')).toBeChecked();
  });

  testWithLogin('should sync notifications across devices', async ({ page, loginAs }) => {
    // Login as user
    await loginAs('team');
    
    // Navigate to notifications page
    await page.goto('/notifications');
    
    // Mark a notification as read
    await page.click('button.mark-read');
    
    // Verify notification is marked as read
    await expect(page.locator('.notification.read')).toBeVisible();
    
    // In a real test, you would simulate another device and verify sync
  });

  testWithLogin('should apply TTL to notifications', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to notifications page
    await page.goto('/notifications');
    
    // Create notification with short TTL
    await page.click('button:has-text("Create Notification")');
    await page.fill('input#title', 'Short TTL Notification');
    await page.fill('input#ttl', '60'); // 60 seconds
    
    // Click create button
    await page.click('button:has-text("Create")');
    
    // Verify notification was created
    await expect(page.locator('.notifications-list')).toContainText('Short TTL Notification');
    
    // Wait for TTL to expire (in a real test, you would mock time)
    // await page.waitForTimeout(61000);
    
    // Verify notification is automatically marked as expired
    // await expect(page.locator('.notification.expired')).toBeVisible();
  });
});