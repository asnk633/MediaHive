// e2e/playwright/multitenant.spec.ts
// E2E tests for multi-tenant functionality

import { test, expect } from '@playwright/test';
import { testWithLogin } from './fixtures';

testWithLogin.describe('Multi-Tenant Mode', () => {
  testWithLogin('should create a new tenant', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to tenants page
    await page.goto('/admin/tenants');
    
    // Click create new tenant button
    await page.click('button:has-text("Create New Tenant")');
    
    // Fill in tenant details
    await page.fill('input#name', 'Test Campus');
    await page.fill('input#domain', 'test-campus.thaibagarden.edu');
    
    // Click create tenant button
    await page.click('button:has-text("Create Tenant")');
    
    // Verify tenant was created
    await expect(page.locator('table')).toContainText('Test Campus');
  });

  testWithLogin('should edit an existing tenant', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to tenants page
    await page.goto('/admin/tenants');
    
    // Find and click edit button for first tenant
    await page.click('button:has-text("Edit")');
    
    // Change tenant name
    await page.fill('input#name', 'Updated Campus');
    
    // Click update tenant button
    await page.click('button:has-text("Update Tenant")');
    
    // Verify tenant was updated
    await expect(page.locator('table')).toContainText('Updated Campus');
  });

  testWithLogin('should delete a tenant', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to tenants page
    await page.goto('/admin/tenants');
    
    // Find and click delete button for first tenant
    await page.click('button:has-text("Delete")');
    
    // Confirm deletion
    await page.on('dialog', dialog => dialog.accept());
    
    // Verify tenant was deleted
    await expect(page.locator('table')).not.toContainText('Updated Campus');
  });

  testWithLogin('should isolate data between tenants', async ({ page, loginAs }) => {
    // Login as admin
    const user = await loginAs('admin');
    
    // Navigate to tasks page
    await page.goto('/tasks');
    
    // Verify user can only see tasks from their tenant
    // This would require checking that tasks from other tenants are not visible
    // Implementation would depend on the specific tenant isolation logic
  });

  testWithLogin('should switch between tenant contexts', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to dashboard
    await page.goto('/admin/insights');
    
    // Switch tenant context
    await page.selectOption('select', 'TG Antla');
    
    // Verify data is filtered for selected tenant
    // This would require checking that only data from the selected tenant is displayed
  });
});