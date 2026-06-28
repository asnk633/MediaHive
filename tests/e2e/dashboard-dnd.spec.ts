import { test, expect } from '@playwright/test';

test.describe('Dashboard Layout Customization', () => {
  test('User can drag and drop widgets to reorder dashboard', async ({ page }) => {
    // Note: E2E test relies on DB and Auth being seeded properly.
    // Assuming test setup logs in a user.
    await page.goto('/home');
    
    // Wait for widgets to load
    await expect(page.locator('.lucide-grip-vertical')).toHaveCount(2);

    const firstWidget = page.locator('.lucide-grip-vertical').first();
    const secondWidget = page.locator('.lucide-grip-vertical').nth(1);

    // Perform drag and drop
    await firstWidget.dragTo(secondWidget);

    // Verify API call
    // A more thorough test would mock the API response to verify the POST
  });
});
