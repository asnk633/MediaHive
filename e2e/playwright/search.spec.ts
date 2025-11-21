// e2e/playwright/search.spec.ts
// E2E tests for search functionality

import { test, expect } from '@playwright/test';
import { loginAs } from './utils/auth';
import { seedIsolated } from './utils/seed';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Seed isolated test data
    await seedIsolated(page, {
      institutions: [
        { id: 1, name: 'Test Institution', tenantId: 1 }
      ],
      users: [
        { id: 1, email: 'admin@test.com', passwordHash: 'hashed', fullName: 'Admin User', role: 'admin', institutionId: 1, tenantId: 1 }
      ],
      tasks: [
        { id: 1, title: 'Test Task 1', description: 'Description for test task', status: 'todo', priority: 'medium', createdById: 1, institutionId: 1, tenantId: 1 },
        { id: 2, title: 'Test Task 2', description: 'Another test task', status: 'in_progress', priority: 'high', createdById: 1, institutionId: 1, tenantId: 1 }
      ],
      events: [
        { id: 1, title: 'Test Event', description: 'Test event description', startTime: '2023-01-01T10:00:00Z', endTime: '2023-01-01T12:00:00Z', createdById: 1, institutionId: 1, tenantId: 1 }
      ]
    });
    
    // Login as admin
    await loginAs(page, 'admin');
  });

  test('should search for tasks by keyword', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Enter search query
    await page.fill('input[placeholder="Search..."]', 'Test Task');
    
    // Submit search
    await page.press('input[placeholder="Search..."]', 'Enter');
    
    // Verify search results
    await expect(page.locator('.search-results')).toContainText('Test Task 1');
    await expect(page.locator('.search-results')).toContainText('Test Task 2');
  });

  test('should search for events by keyword', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Enter search query
    await page.fill('input[placeholder="Search..."]', 'Test Event');
    
    // Submit search
    await page.press('input[placeholder="Search..."]', 'Enter');
    
    // Verify search results
    await expect(page.locator('.search-results')).toContainText('Test Event');
  });

  test('should filter search results by type', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Enter search query
    await page.fill('input[placeholder="Search..."]', 'Test');
    
    // Select task filter
    await page.selectOption('select[name="type"]', 'task');
    
    // Submit search
    await page.press('input[placeholder="Search..."]', 'Enter');
    
    // Verify only tasks are shown
    await expect(page.locator('.search-results .task-item')).toHaveCount(2);
    await expect(page.locator('.search-results .event-item')).toHaveCount(0);
  });

  test('should perform semantic search', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    
    // Enter search query
    await page.fill('input[placeholder="Search..."]', 'urgent task');
    
    // Enable semantic search
    await page.click('input[name="semantic"]');
    
    // Submit search
    await page.press('input[placeholder="Search..."]', 'Enter');
    
    // Verify search results (mock results for semantic search)
    await expect(page.locator('.search-results')).toBeVisible();
  });
});