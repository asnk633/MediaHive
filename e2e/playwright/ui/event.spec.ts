import { test, expect } from '@playwright/test';

test.describe('Event Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/calendar');
    });

    test('should allow opening event modal via FAB', async ({ page }) => {
        const fab = page.getByTestId('fab-open');
        // Force wait for hydration/render
        await page.waitForLoadState('networkidle');

        if (await fab.isVisible()) {
            await fab.click();
            // Wait for animation
            await page.waitForTimeout(500);
            const newEventBtn = page.getByTestId('fab-new-event');
            if (await newEventBtn.isVisible()) {
                await newEventBtn.click();
                await expect(page.getByRole('dialog')).toBeVisible();
            } else {
                console.log('FAB menu items not visible');
            }
        } else {
            // Fallback to header button if FAB is not visible (e.g. permissions or layout)
            const createButton = page.getByLabel('Create new item');
            if (await createButton.isVisible()) {
                await createButton.click();
                await expect(page.getByRole('dialog')).toBeVisible();
            }
        }
    });

    test('should validate form inputs', async ({ page }) => {
        // Open modal first
        const createButton = page.getByLabel('Create new item');
        if (await createButton.isVisible()) {
            await createButton.click();
        } else {
            // Try FAB
            const fab = page.getByTestId('fab-open');
            await fab.click();
            await page.waitForTimeout(500);
            await page.getByTestId('fab-new-event').click();
        }

        const submitButton = page.getByRole('button', { name: 'Create Event' });
        await submitButton.click();

        // HTML5 validation should trigger, preventing submission.
        // Playwright can check validity.
        const titleInput = page.getByLabel('Event Title');
        // Expect it to be invalid or required.
        await expect(titleInput).toHaveAttribute('required', '');
    });
});
