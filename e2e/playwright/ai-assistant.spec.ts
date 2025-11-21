// e2e/playwright/ai-assistant.spec.ts
// Tests for AI assistant functionality

import { test, expect } from '@playwright/test';
import { seedUser, seedTask } from './helpers/seed';

test.describe('AI Assistant', () => {
  test('should generate task suggestions', async ({ page }) => {
    // Seed user
    const user = await seedUser(page, 'admin');

    // Login user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Navigate to AI assistant page
    await page.goto('/ai-assistant');

    // Wait for AI assistant panel to load
    await page.waitForSelector('[data-testid="ai-assistant-toggle"]', { state: 'visible' });

    // Open AI assistant panel
    await page.click('[data-testid="ai-assistant-toggle"]');

    // Verify AI assistant dropdown is visible
    await expect(page.locator('[data-testid="ai-assistant-dropdown"]')).toBeVisible();

    // Fill in task title and description
    await page.fill('#task-title', 'Test Task');
    await page.fill('#task-description', 'This is a test task for AI suggestions');

    // Click generate suggestions button
    await page.click('button:has-text("Generate Suggestions")');

    // Wait for suggestions to load
    await page.waitForSelector('.suggestions-result', { state: 'visible' });

    // Verify suggestions are displayed
    await expect(page.locator('.suggestions-result')).toBeVisible();
    await expect(page.locator('.suggestions-result h5')).toHaveText('Suggestions:');
  });

  test('should summarize notifications', async ({ page }) => {
    // Seed user
    const user = await seedUser(page, 'admin');

    // Login user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Navigate to AI assistant page
    await page.goto('/ai-assistant');

    // Wait for AI assistant panel to load
    await page.waitForSelector('[data-testid="ai-assistant-toggle"]', { state: 'visible' });

    // Open AI assistant panel
    await page.click('[data-testid="ai-assistant-toggle"]');

    // Click summarize notifications button
    await page.click('button:has-text("Summarize Notifications")');

    // Wait for summary to load
    await page.waitForSelector('.summary-result', { state: 'visible' });

    // Verify summary is displayed
    await expect(page.locator('.summary-result')).toBeVisible();
    await expect(page.locator('.summary-result h5')).toHaveText('Summary:');
  });

  test('should show loading state during AI processing', async ({ page }) => {
    // Seed user
    const user = await seedUser(page, 'admin');

    // Login user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Navigate to AI assistant page
    await page.goto('/ai-assistant');

    // Wait for AI assistant panel to load
    await page.waitForSelector('[data-testid="ai-assistant-toggle"]', { state: 'visible' });

    // Open AI assistant panel
    await page.click('[data-testid="ai-assistant-toggle"]');

    // Fill in task title and description
    await page.fill('#task-title', 'Test Task');
    await page.fill('#task-description', 'This is a test task for AI suggestions');

    // Click generate suggestions button
    await page.click('button:has-text("Generate Suggestions")');

    // Verify loading state is shown
    await expect(page.locator('.loading')).toBeVisible();
    await expect(page.locator('.loading')).toHaveText('Processing...');

    // Wait for loading to complete
    await page.waitForSelector('.suggestions-result', { state: 'visible' });

    // Verify loading state is hidden
    await expect(page.locator('.loading')).not.toBeVisible();
  });
});