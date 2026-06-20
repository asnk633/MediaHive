import { test, expect } from './fixtures/db-fixture';

/**
 * Phase 3: Critical User Journeys - E2E Tests
 * 
 * Rules:
 * - NO API mocking (real backend only)
 * - Minimal assertions (visibility + success)
 * - One complete journey per test
 * - Real Firebase auth and database
 * 
 * Scope: 2 tests validating critical integration points
 */

const ADMIN_USER = {
    email: 'media@thaibagarden.com',
    password: 'media@thaiba'
};

test.describe('Critical User Journeys', () => {

    /**
     * Test 1: Admin Task Creation Flow
     * 
     * Real User Risk: If this fails, admins cannot create tasks,
     * blocking core workflow for task management.
     * 
     * Integration Points Validated:
     * - Firebase Authentication
     * - Next.js API routes (/api/tasks)
     * - Firestore database writes
     * - Real-time UI updates
     */
    test('Admin: Create task end-to-end', async ({ page }) => {
        const taskTitle = `E2E Test Task ${Date.now()}`;

        // Login as admin
        await page.goto('http://localhost:3000/login');
        await page.evaluate(() => {
            localStorage.setItem('mediahive_onboarding_complete', 'true');
            localStorage.setItem('hasSeenMemberWelcome-v1', 'true');
        });
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        await emailInput.click();
        await emailInput.fill(ADMIN_USER.email);
        await passwordInput.click();
        await passwordInput.fill(ADMIN_USER.password);
        
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeEnabled();
        await submitButton.click();
        await expect(page).toHaveURL(/.*home/, { timeout: 30000 });

        // Navigate to tasks
        await page.goto('/tasks');
        await page.waitForLoadState('load');

        // Click New Task button
        await page.getByLabel('New Task').click();

        // Wait for task form to fully load (avoid networkidle - SSE keeps network busy)
        await page.waitForLoadState('domcontentloaded');
        const titleInput = page.getByPlaceholder('What needs to be done?');
        await expect(titleInput).toBeVisible({ timeout: 15000 });

        // Fill task form
        await titleInput.fill(taskTitle);
        await page.getByPlaceholder('Add details...').fill('E2E test description');

        // Set due date via shortcut Alt+ArrowRight (tomorrow)
        await page.keyboard.press('Alt+ArrowRight');

        // Submit task
        await page.click('button:has-text("Create Task")');

        // Verify task appears in list
        await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
    });

    /**
     * Test 2: Admin Feature Access
     * 
     * Real User Risk: If this fails, admins might not see admin-specific features,
     * or non-admins might gain unauthorized access to admin features.
     * 
     * Integration Points Validated:
     * - Firebase Authentication with custom claims
     * - Role-based UI rendering
     * - AuthContext integration
     */
    test('Admin: Can see admin-only features', async ({ page }) => {
        // Login as admin
        await page.goto('http://localhost:3000/login');
        await page.evaluate(() => localStorage.setItem('mediahive_onboarding_complete', 'true'));
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        await emailInput.click();
        await emailInput.fill(ADMIN_USER.email);
        await passwordInput.click();
        await passwordInput.fill(ADMIN_USER.password);
        
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeEnabled();
        await submitButton.click();
        await expect(page).toHaveURL(/.*home/, { timeout: 30000 });

        // Navigate to tasks
        await page.goto('/tasks');
        await page.waitForLoadState('load');

        // Verify admin can see Admin Confidence Panel button
        await expect(page.getByTitle('Admin Confidence Panel')).toBeVisible();
    });
});
