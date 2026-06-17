import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsGuest } from './helpers/auth';
import { safeGoto } from './helpers/navigation';

test.describe('Settings Page', () => {
  test('Settings page loads', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('Admin sees all config options', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/settings');
    await expect(page.getByText(/system configurations/i)).toBeVisible();
    await expect(page.getByText(/general settings/i)).toBeVisible();
  });

  test('Guest has limited access or redirect on settings page', async ({ page }) => {
    await loginAsGuest(page);
    await safeGoto(page, '/settings');

    await expect(async () => {
      const isRedirected = !page.url().includes('/settings');
      const accessDeniedVisible = await page.getByText(/access denied|unauthorized/i).isVisible();
      expect(isRedirected || accessDeniedVisible).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });

  test('Settings persist after reload', async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, '/settings');

    const toggle = page.locator('button[role="switch"], input[type="checkbox"]').first();
    await expect(toggle).toBeVisible();

    const isCheckbox = await toggle.evaluate((el) => el.tagName === 'INPUT');
    const isCheckedInitially = isCheckbox
      ? await toggle.isChecked()
      : (await toggle.getAttribute('aria-checked')) === 'true';

    await toggle.click();

    // Wait for the application to save the state
    await page.waitForTimeout(1000);

    await page.reload();

    if (isCheckbox) {
      expect(await toggle.isChecked()).toBe(!isCheckedInitially);
    } else {
      await expect(toggle).toHaveAttribute('aria-checked', isCheckedInitially ? 'false' : 'true');
    }
  });
});
