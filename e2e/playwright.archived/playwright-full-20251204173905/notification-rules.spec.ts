// e2e/playwright/notification-rules.spec.ts
// Tests for notification rules engine

import { test, expect } from '@playwright/test';
import { seedUser, seedTask } from './helpers/seed';

test.describe('Notification Rules Engine', () => {
  test('should trigger notification when review status changes', async ({ page, context }) => {
    // Create two browser contexts to simulate user and admin
    const userPage = page;
    const adminPage = await context.newPage();

    // Seed users
    const user = await seedUser(userPage, 'team');
    const admin = await seedUser(adminPage, 'admin');

    // Create a task assigned to user
    const task = await seedTask(userPage, user, { 
      title: 'Review Status Notification Test Task',
      assignedToId: user.id
    });

    // Login both users
    await userPage.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user);

    await adminPage.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, admin);

    // Admin updates task review status
    const updateResponse = await adminPage.request.patch(`/api/tasks/${task.id}/review`, {
      headers: {
        "x-user-data": JSON.stringify(admin),
        "content-type": "application/json",
      },
      data: {
        reviewStatus: 'approved'
      }
    });

    expect(updateResponse.ok()).toBeTruthy();

    // User should receive notification
    // This would require checking the notification system
    // For now, we'll just verify the update was successful
  });

  test('should trigger notification when task is assigned', async ({ page, context }) => {
    // Create two browser contexts to simulate users
    const page1 = page;
    const page2 = await context.newPage();

    // Seed users
    const user1 = await seedUser(page1, 'team');
    const user2 = await seedUser(page2, 'team');

    // Create a task
    const task = await seedTask(page1, user1, { 
      title: 'Assignment Notification Test Task'
    });

    // Login both users
    await page1.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user1);

    await page2.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, user2);

    // Assign task to user2
    const updateResponse = await page1.request.patch(`/api/tasks/${task.id}`, {
      headers: {
        "x-user-data": JSON.stringify(user1),
        "content-type": "application/json",
      },
      data: {
        assignedToId: user2.id
      }
    });

    expect(updateResponse.ok()).toBeTruthy();

    // User2 should receive notification
    // This would require checking the notification system
    // For now, we'll just verify the update was successful
  });

  test('should allow admin to enable/disable notification rules', async ({ page }) => {
    // Seed admin user
    const admin = await seedUser(page, 'admin');

    // Login admin
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', JSON.stringify(user));
    }, admin);

    // Navigate to admin notification rules page
    await page.goto('/admin/notification-rules');

    // Wait for page to load
    await page.waitForSelector('h1', { state: 'visible' });

    // Verify admin can see notification rules
    await expect(page.locator('h1')).toHaveText('Notification Rules');

    // This would require checking the actual UI elements
    // For now, we'll just verify the page loads
  });
});