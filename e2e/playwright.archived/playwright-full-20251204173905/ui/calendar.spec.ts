import { test, expect } from '@playwright/test';

test.describe('Calendar Page', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to calendar page
        await page.goto('/calendar');
    });

    test('should display timeline header', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Timeline' })).toBeVisible();
    });

    test('should display filter buttons', async ({ page }) => {
        await expect(page.getByLabel('Filter items')).toBeVisible();
    });

    test('should open create event modal', async ({ page }) => {
        await page.getByLabel('Create new item').click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Create Event' })).toBeVisible();
    });

    test('should toggle filters', async ({ page }) => {
        const filterButton = page.getByLabel('Filter items');
        await filterButton.click();
        // Just ensure it doesn't crash
        await expect(filterButton).toBeVisible();
    });
});
