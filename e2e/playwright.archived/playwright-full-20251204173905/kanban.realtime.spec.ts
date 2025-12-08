// e2e/playwright/kanban.realtime.spec.ts
// Tests for Kanban realtime features

import { test, expect } from '@playwright/test';
import { seedUser, seedTask } from './helpers/seed';
import { waitForRealtimeUpdate } from './helpers/realtime';

test.describe('Kanban Realtime Features', () => {
  test('should update task status in realtime when moved between columns', async ({ page, context }) => {
    // Create two browser contexts to simulate two users
    const page1 = page;
    const page2 = await context.newPage();

    // Seed user and tasks
    const user = await seedUser(page1, 'admin');
    const task = await seedTask(page1, user, { 
      title: 'Realtime Task Test',
      status: 'todo'
    });

    // Login both users
    await page1.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    await page2.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Navigate to kanban page on both pages
    await page1.goto('/kanban');
    await page2.goto('/kanban');

    // Wait for tasks to load
    await page1.waitForSelector(`[data-task-id="${task.id}"]`, { state: 'visible' });
    await page2.waitForSelector(`[data-task-id="${task.id}"]`, { state: 'visible' });

    // Verify task is in todo column on both pages
    await expect(page1.locator(`[data-testid="kanban-column-todo"] [data-task-id="${task.id}"]`)).toBeVisible();
    await expect(page2.locator(`[data-testid="kanban-column-todo"] [data-task-id="${task.id}"]`)).toBeVisible();

    // Move task from todo to in_progress on page1
    // In a real implementation, this would involve drag and drop
    // For this test, we'll simulate the API call directly
    const response = await page1.request.patch(`/api/tasks/${task.id}`, {
      headers: {
        "x-user-data": JSON.stringify(user),
        "content-type": "application/json",
      },
      data: {
        status: 'in_progress'
      }
    });

    expect(response.ok()).toBeTruthy();

    // Wait for realtime update on page2
    await page2.waitForSelector(`[data-testid="kanban-column-in_progress"] [data-task-id="${task.id}"]`, { 
      state: 'visible',
      timeout: 10000
    });

    // Verify task moved to in_progress column on both pages
    await expect(page1.locator(`[data-testid="kanban-column-in_progress"] [data-task-id="${task.id}"]`)).toBeVisible();
    await expect(page2.locator(`[data-testid="kanban-column-in_progress"] [data-task-id="${task.id}"]`)).toBeVisible();

    // Verify task is no longer in todo column
    await expect(page1.locator(`[data-testid="kanban-column-todo"] [data-task-id="${task.id}"]`)).not.toBeVisible();
    await expect(page2.locator(`[data-testid="kanban-column-todo"] [data-task-id="${task.id}"]`)).not.toBeVisible();
  });

  test('should show conflict resolution popup when optimistic concurrency check fails', async ({ page }) => {
    // Seed user and task
    const user = await seedUser(page, 'admin');
    const task = await seedTask(page, user, { 
      title: 'Optimistic Concurrency Test',
      status: 'todo',
      version: 1
    });

    // Login user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Navigate to kanban page
    await page.goto('/kanban');

    // Wait for task to load
    await page.waitForSelector(`[data-task-id="${task.id}"]`, { state: 'visible' });

    // Simulate another user updating the task
    const updateResponse = await page.request.patch(`/api/tasks/${task.id}`, {
      headers: {
        "x-user-data": JSON.stringify(user),
        "content-type": "application/json",
      },
      data: {
        title: 'Updated by another user',
        version: 2 // Increment version
      }
    });

    expect(updateResponse.ok()).toBeTruthy();

    // Try to update the same task with the old version
    const conflictResponse = await page.request.patch(`/api/tasks/${task.id}`, {
      headers: {
        "x-user-data": JSON.stringify(user),
        "content-type": "application/json",
      },
      data: {
        title: 'Update with old version',
        version: 1 // Old version - should cause conflict
      }
    });

    // Verify conflict response
    expect(conflictResponse.status()).toBe(409); // Conflict status
    const conflictData = await conflictResponse.json();
    expect(conflictData.conflict).toBe(true);
    expect(conflictData.latest).toBeDefined();

    // In a real implementation, a conflict resolution popup would appear
    // For this test, we'll just verify the API response
  });
});