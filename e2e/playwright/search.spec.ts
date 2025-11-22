// e2e/playwright/search.spec.ts
// E2E tests for search functionality

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Implement proper test setup
    // For now, we'll just navigate to the search page
    await page.goto('/search');
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