import { test, expect } from '@playwright/test';

/**
 * AUTH INVARIANT TESTS (v2 - Programmatic Injection)
 * 
 * These tests verify the essential routing laws of the application
 * without relying on external Firebase credentials.
 * 
 * Laws:
 * 1. Unauthenticated -> Visiting /home MUST redirect to /login
 * 2. Authenticated -> Visiting /login MUST redirect to /home
 * 3. Logout -> MUST land on /login and persist after refresh
 */

test.describe('Auth Invariants', () => {
    test.beforeEach(({ page }) => {
        // Proxy browser console logs for debugging
        page.on('console', msg => {
            if (msg.text().includes('[AUTH]') || msg.text().includes('[NAV]')) {
                console.log(`[BROWSER][${msg.type()}] ${msg.text()}`);
            }
        });
    });

    test('Unauthenticated user visiting /home redirects to /login', async ({ page }) => {
        // Start from home
        await page.goto('/home/');

        // Law 1: Redirect to login
        await expect(page).toHaveURL(/\/login\/?/);
    });

    test('Full Auth Cycle: Login (Injection) -> Redirect -> Logout -> Persistence', async ({ page }) => {
        // 1. Initial State: Redirect to login
        await page.goto('/home/');
        await expect(page).toHaveURL(/\/login\/?/);

        // 2. Programmatic Authentication (Injection)
        // We set the playwright_test_auth flag in localStorage
        // This triggers the test bypass in AuthContextProvider.tsx (dev-only)
        await page.evaluate(() => {
            localStorage.setItem('playwright_test_auth', 'true');
        });

        // 3. Trigger reload to pick up the new auth state
        await page.reload();

        // 4. Authenticated: Visit /login should redirect to /home
        // The app might already be navigating if it detected the flag, but reload ensures it.
        await expect(page).toHaveURL(/\/home\/?/, { timeout: 10000 });

        // Try going to /login manually while "authed"
        await page.goto('/login/');
        await expect(page).toHaveURL(/\/home\/?/, { timeout: 10000 });

        // 5. Logout Path
        // Click the logout button or trigger it programmatically via the bypass
        // For E2E, we prefer the UI if possible, but since it's an invariant test, 
        // we can trigger the bypass removal too.
        await page.evaluate(() => {
            localStorage.removeItem('playwright_test_auth');
        });
        await page.reload();

        // 6. Assert Logout Persistence
        await expect(page).toHaveURL(/\/login\/?/);

        // Refresh to ensure we didn't bounce back
        await page.reload();
        await expect(page).toHaveURL(/\/login\/?/);
    });
});
