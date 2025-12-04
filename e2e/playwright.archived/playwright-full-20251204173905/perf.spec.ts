// e2e/playwright/perf.spec.ts
// Performance tests for M6 features

import { test, expect } from '@playwright/test';
import { seedUser, seedTask } from './helpers/seed';

async function simulateOffline(page: any) {
  await page.context().setOffline(true);
}

async function simulateOnline(page: any) {
  await page.context().setOffline(false);
}

test.describe('Performance', () => {
  test('should measure SSR hydration times', async ({ page }) => {
    // Seed user
    const user = await seedUser(page, 'admin');

    // Login user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Measure page load time
    const startTime = Date.now();
    
    // Navigate to tasks page
    await page.goto('/tasks');
    
    const loadTime = Date.now() - startTime;
    
    // Verify page loaded successfully
    await expect(page.locator('h1')).toHaveText('Task Review Dashboard');
    
    // Log load time for monitoring
    console.log(`SSR Hydration Time: ${loadTime}ms`);
    
    // Assert reasonable load time (under 3 seconds)
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle offline-first behavior gracefully', async ({ page }) => {
    // Seed user and task
    const user = await seedUser(page, 'admin');
    const task = await seedTask(page, user, { title: 'Offline Performance Test Task' });

    // Login user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Navigate to tasks page
    await page.goto('/tasks');

    // Wait for task to load
    await page.waitForSelector(`[data-task-id="${task.id}"]`, { state: 'visible' });

    // Simulate offline mode
    await simulateOffline(page);

    // Verify we're offline
    expect(await page.evaluate(() => navigator.onLine)).toBeFalsy();

    // Try to update a task while offline
    const startTime = Date.now();
    const updateResponse = await page.request.patch(`/api/tasks/${task.id}`, {
      headers: {
        "x-user-data": JSON.stringify(user),
        "content-type": "application/json",
      },
      data: {
        title: 'Updated Offline Task Title'
      }
    });
    const responseTime = Date.now() - startTime;

    // The request should fail when offline
    expect(updateResponse.status()).toBe(0); // 0 indicates network error

    // Response should be fast (under 100ms) since it's a local failure
    expect(responseTime).toBeLessThan(100);

    // Simulate going back online
    await simulateOnline(page);

    // Verify we're online
    expect(await page.evaluate(() => navigator.onLine)).toBeTruthy();
  });

  test('should lazy load large components', async ({ page }) => {
    // Seed user
    const user = await seedUser(page, 'admin');

    // Login user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Navigate to kanban page
    const startTime = Date.now();
    await page.goto('/kanban');
    const loadTime = Date.now() - startTime;

    // Verify page loaded successfully
    await expect(page.locator('.kanban-board')).toBeVisible();
    
    // Log load time for monitoring
    console.log(`Kanban Page Load Time: ${loadTime}ms`);
    
    // Initial load should be fast due to lazy loading
    expect(loadTime).toBeLessThan(2000);
  });

  test('should efficiently handle progressive batch loading', async ({ page }) => {
    // Seed user
    const user = await seedUser(page, 'admin');

    // Login user
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    // Navigate to kanban page
    await page.goto('/kanban');

    // Verify initial tasks are loaded
    await expect(page.locator('.kanban-board')).toBeVisible();

    // Measure time to load more tasks via infinite scroll
    const startTime = Date.now();
    
    // Scroll to trigger infinite loading
    await page.evaluate(() => {
      const sentinel = document.getElementById('kanban-sentinel');
      if (sentinel) {
        sentinel.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    // Wait for loading indicator to appear and disappear
    await page.waitForSelector('.loading-indicator', { state: 'visible' });
    await page.waitForSelector('.loading-indicator', { state: 'detached' });
    
    const loadTime = Date.now() - startTime;
    
    // Log load time for monitoring
    console.log(`Batch Load Time: ${loadTime}ms`);
    
    // Batch loading should be efficient
    expect(loadTime).toBeLessThan(1500);
  });
});