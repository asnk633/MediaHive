import { test, expect } from '@playwright/test';

test.describe('Firebase Auth Smoke Test', () => {
    test('should load login page and show correct elements', async ({ page }) => {
        await page.goto('/login');

        // Check key elements
        await expect(page.getByText('Thaiba Tasks')).toBeVisible();
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });

    test('should handle invalid credentials gracefully', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel('Email').fill('invalid@test.com');
        await page.getByLabel('Password').fill('wrongpassword');
        await page.getByRole('button', { name: 'Login' }).click();

        // Expect error message
        // Note: detailed error might vary depending on network, but UI should show feedback
        // In our component: setError("Login failed...");
        await expect(page.getByText('Login failed')).toBeVisible();
    });
});
