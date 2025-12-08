// e2e/playwright/audit.spec.ts
// E2E tests for audit trail functionality

import { test, expect } from '@playwright/test';
import { testWithLogin } from './fixtures';

testWithLogin.describe('Audit Trail', () => {
  testWithLogin('should log user actions', async ({ page, loginAs }) => {
    // Login as admin
    const user = await loginAs('admin');
    
    // Navigate to tasks page
    await page.goto('/tasks');
    
    // Create a new task
    await page.click('button:has-text("Create Task")');
    await page.fill('input#title', 'Audit Test Task');
    await page.fill('textarea#description', 'This task is for audit testing');
    await page.click('button:has-text("Create")');
    
    // Navigate to audit log page
    await page.goto('/admin/audit-log');
    
    // Verify audit log entry for task creation
    await expect(page.locator('table')).toContainText('create');
    await expect(page.locator('table')).toContainText('task');
    await expect(page.locator('table')).toContainText(user.email);
  });

  testWithLogin('should display audit log filters', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to audit log page
    await page.goto('/admin/audit-log');
    
    // Verify filter options are available
    await expect(page.locator('select[name="action"]')).toBeVisible();
    await expect(page.locator('select[name="resourceType"]')).toBeVisible();
    await expect(page.locator('input[name="startDate"]')).toBeVisible();
    await expect(page.locator('input[name="endDate"]')).toBeVisible();
  });

  testWithLogin('should filter audit logs by action', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to audit log page
    await page.goto('/admin/audit-log');
    
    // Filter by create action
    await page.selectOption('select[name="action"]', 'create');
    
    // Verify only create actions are shown
    const actions = await page.locator('table tbody tr td:nth-child(3)').allTextContents();
    for (const action of actions) {
      expect(action).toEqual('create');
    }
  });

  testWithLogin('should filter audit logs by resource type', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to audit log page
    await page.goto('/admin/audit-log');
    
    // Filter by task resource type
    await page.selectOption('select[name="resourceType"]', 'task');
    
    // Verify only task resources are shown
    const resourceTypes = await page.locator('table tbody tr td:nth-child(4)').allTextContents();
    for (const resourceType of resourceTypes) {
      expect(resourceType).toEqual('task');
    }
  });

  testWithLogin('should display audit log statistics', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to audit log stats page
    await page.goto('/admin/audit-log/stats');
    
    // Verify statistics charts are displayed
    await expect(page.locator('h2:has-text("Action Counts")')).toBeVisible();
    await expect(page.locator('h2:has-text("Resource Type Counts")')).toBeVisible();
    await expect(page.locator('h2:has-text("Daily Activity")')).toBeVisible();
    await expect(page.locator('h2:has-text("Top Users")')).toBeVisible();
  });

  testWithLogin('should export audit logs', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to audit log page
    await page.goto('/admin/audit-log');
    
    // Click export button
    await page.click('button:has-text("Export")');
    
    // Verify export options are shown
    await expect(page.locator('button:has-text("Export as CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Export as JSON")')).toBeVisible();
  });
});