// e2e/playwright/automations.spec.ts
// E2E tests for automation builder functionality

import { test, expect } from '@playwright/test';
import { testWithLogin } from './fixtures';

testWithLogin.describe('Automation Builder', () => {
  testWithLogin('should create a new automation rule', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to automations page
    await page.goto('/admin/automations');
    
    // Click create new rule button
    await page.click('button:has-text("Create New Rule")');
    
    // Fill in rule details
    await page.fill('input#name', 'Test Automation Rule');
    await page.fill('textarea#description', 'This is a test automation rule');
    await page.selectOption('select#triggerType', 'task_created');
    
    // Click create rule button
    await page.click('button:has-text("Create Rule")');
    
    // Verify rule was created
    await expect(page.locator('table')).toContainText('Test Automation Rule');
  });

  testWithLogin('should edit an existing automation rule', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to automations page
    await page.goto('/admin/automations');
    
    // Find and click edit button for first rule
    await page.click('button:has-text("Edit")');
    
    // Change rule name
    await page.fill('input#name', 'Updated Automation Rule');
    
    // Click update rule button
    await page.click('button:has-text("Update Rule")');
    
    // Verify rule was updated
    await expect(page.locator('table')).toContainText('Updated Automation Rule');
  });

  testWithLogin('should delete an automation rule', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to automations page
    await page.goto('/admin/automations');
    
    // Find and click delete button for first rule
    await page.click('button:has-text("Delete")');
    
    // Confirm deletion
    await page.on('dialog', dialog => dialog.accept());
    
    // Verify rule was deleted
    await expect(page.locator('table')).not.toContainText('Updated Automation Rule');
  });

  testWithLogin('should use automation template', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to automations page
    await page.goto('/admin/automations');
    
    // Switch to builder tab
    await page.click('button:has-text("Rule Builder")');
    
    // Select urgent task template
    await page.click('div:has-text("Urgent Task Template")');
    
    // Verify template was applied
    await expect(page.locator('input#name')).toHaveValue('Urgent Task Template');
  });
});