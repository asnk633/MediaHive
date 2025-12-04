import { test, expect } from '@playwright/test';

test.describe('Visual Regression Baseline', () => {
  test('Home page baseline', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('Tasks list baseline', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveScreenshot('tasks-list.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('Task composer baseline', async ({ page }) => {
    await page.goto('/tasks/new');
    await expect(page).toHaveScreenshot('task-composer.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('Notifications composer baseline', async ({ page }) => {
    await page.goto('/notifications/new');
    await expect(page).toHaveScreenshot('notifications-composer.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('Profile page baseline', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveScreenshot('profile-page.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('Calendar page baseline', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page).toHaveScreenshot('calendar-page.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('Reports page baseline', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveScreenshot('reports-page.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test('Settings page baseline', async ({ page }) => {
    await page.goto('/settings/notifications');
    await expect(page).toHaveScreenshot('settings-page.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });
});