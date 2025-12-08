// e2e/playwright/shared-cache.spec.ts
// Tests for shared query cache and global event bus

import { test, expect } from '@playwright/test';
import { seedUser, seedTask } from './helpers/seed';

test.describe('Shared Query Cache', () => {
  test('should preserve data state when navigating between pages', async ({ page }) => {
    // Seed user and tasks
    const user = await seedUser(page, 'admin');
    
    // Create multiple tasks
    const task1 = await seedTask(page, user, { title: 'Shared Cache Test Task 1' });
    const task2 = await seedTask(page, user, { title: 'Shared Cache Test Task 2' });

    // Login user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Navigate to tasks page
    await page.goto('/tasks');

    // Wait for tasks to load
    await page.waitForSelector(`[data-task-id="${task1.id}"]`, { state: 'visible' });
    await page.waitForSelector(`[data-task-id="${task2.id}"]`, { state: 'visible' });

    // Verify tasks are visible
    await expect(page.locator(`[data-task-id="${task1.id}"]`)).toBeVisible();
    await expect(page.locator(`[data-task-id="${task2.id}"]`)).toBeVisible();

    // Navigate to another page (e.g., calendar)
    await page.click('a[href="/calendar"]');

    // Wait for navigation
    await page.waitForURL('**/calendar');

    // Navigate back to tasks page
    await page.click('a[href="/tasks"]');

    // Wait for navigation
    await page.waitForURL('**/tasks');

    // Verify tasks are still visible (cached)
    await expect(page.locator(`[data-task-id="${task1.id}"]`)).toBeVisible();
    await expect(page.locator(`[data-task-id="${task2.id}"]`)).toBeVisible();
  });

  test('should update UI from events instantly', async ({ page, context }) => {
    // Create two browser contexts to simulate two users
    const page1 = page;
    const page2 = await context.newPage();

    // Seed user and task
    const user = await seedUser(page1, 'admin');
    const task = await seedTask(page1, user, { title: 'Event Update Test Task' });

    // Login both users
    await page1.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    await page2.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Navigate to tasks page on both pages
    await page1.goto('/tasks');
    await page2.goto('/tasks');

    // Wait for task to load
    await page1.waitForSelector(`[data-task-id="${task.id}"]`, { state: 'visible' });
    await page2.waitForSelector(`[data-task-id="${task.id}"]`, { state: 'visible' });

    // Update task on page1
    const updateResponse = await page1.request.patch(`/api/tasks/${task.id}`, {
      headers: {
        "x-user-data": JSON.stringify(user),
        "content-type": "application/json",
      },
      data: {
        title: 'Updated Task Title'
      }
    });

    expect(updateResponse.ok()).toBeTruthy();

    // Wait for update to propagate to page2
    await page2.waitForFunction((taskId) => {
      const taskElement = document.querySelector(`[data-task-id="${taskId}"] .task-title`);
      return taskElement && taskElement.textContent === 'Updated Task Title';
    }, task.id, { timeout: 10000 });

    // Verify task title is updated on both pages
    await expect(page1.locator(`[data-task-id="${task.id}"] .task-title`)).toHaveText('Updated Task Title');
    await expect(page2.locator(`[data-task-id="${task.id}"] .task-title`)).toHaveText('Updated Task Title');
  });
});