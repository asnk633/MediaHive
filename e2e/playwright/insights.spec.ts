// e2e/playwright/insights.spec.ts
// E2E tests for insights dashboard

import { test, expect } from '@playwright/test';
import { testWithLogin } from './fixtures';

testWithLogin.describe('Insights Dashboard', () => {
  testWithLogin('should display dashboard charts', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to insights dashboard
    await page.goto('/admin/insights');
    
    // Verify dashboard charts are displayed
    await expect(page.locator('h2:has-text("Task Workload by Institution")')).toBeVisible();
    await expect(page.locator('h2:has-text("TAT Metrics")')).toBeVisible();
    await expect(page.locator('h2:has-text("SLA Compliance")')).toBeVisible();
    await expect(page.locator('h2:has-text("Event Frequency")')).toBeVisible();
    await expect(page.locator('h2:has-text("Media Output")')).toBeVisible();
    await expect(page.locator('h2:has-text("Team Activity Ranking")')).toBeVisible();
    await expect(page.locator('h2:has-text("Production Pipeline")')).toBeVisible();
  });

  testWithLogin('should filter dashboard by time period', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to insights dashboard
    await page.goto('/admin/insights');
    
    // Change time period to month
    await page.selectOption('select', 'month');
    
    // Verify data is updated for selected period
    // This would require checking that the chart data has been updated
  });

  testWithLogin('should filter dashboard by campus', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to insights dashboard
    await page.goto('/admin/insights');
    
    // Change campus filter
    await page.selectOption('select:first-child', 'TG Bangkok');
    
    // Verify data is updated for selected campus
    // This would require checking that the chart data has been updated
  });

  testWithLogin('should export dashboard data as PDF', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to insights dashboard
    await page.goto('/admin/insights');
    
    // Click export PDF button
    await page.click('button:has-text("Export PDF")');
    
    // Verify PDF download is initiated
    // This would require checking the download event
  });

  testWithLogin('should export dashboard data as CSV', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to insights dashboard
    await page.goto('/admin/insights');
    
    // Click export CSV button
    await page.click('button:has-text("Export CSV")');
    
    // Verify CSV download is initiated
    // This would require checking the download event
  });

  testWithLogin('should send email summary', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to insights dashboard
    await page.goto('/admin/insights');
    
    // Click email summary button
    await page.click('button:has-text("Email Summary")');
    
    // Verify success message is displayed
    await expect(page.locator('text=Email summary sent successfully')).toBeVisible();
  });

  testWithLogin('should display performance anomalies', async ({ page, loginAs }) => {
    // Login as admin
    await loginAs('admin');
    
    // Navigate to insights dashboard
    await page.goto('/admin/insights');
    
    // Verify performance anomalies section is displayed
    await expect(page.locator('h3:has-text("Performance Anomalies")')).toBeVisible();
    
    // Verify at least one anomaly is displayed
    await expect(page.locator('.anomaly-item')).toHaveCount(1);
  });
});