import { test, expect } from '@playwright/test';

test('smoke: page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});