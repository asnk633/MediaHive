import { test, expect } from '@playwright/test';

test.describe('Firebase Runtime Validation', () => {
    test('should initialize Firebase and set debug globals on /debug/firebase', async ({ page }) => {
        // Go to debug page
        await page.goto('/debug/firebase');

        // Wait for READY status
        await expect(page.locator('text=READY')).toBeVisible({ timeout: 10000 });

        // Get the debug object from the page content (pre tag)
        const debugContent = await page.locator('pre').textContent();
        expect(debugContent).toBeTruthy();

        const debugState = JSON.parse(debugContent!);
        console.log('[TEST] Debug State:', debugState);

        // Validation
        expect(debugState.ready).toBe(true);
        expect(debugState.debug).toBeTruthy();
        expect(debugState.debug.keysPresent.apiKey).toBe(true);
        expect(debugState.debug.keysPresent.authDomain).toBe(true);

        // Check persistence - expect 'local' or 'in-memory'
        expect(['local', 'in-memory']).toContain(debugState.debug.persistenceOutcome);
    });

    test('getFirebaseAuth should eventually resolve', async ({ page }) => {
        await page.goto('/debug/firebase');

        // Evaluate in browser
        const authReady = await page.evaluate(async () => {
            // Wait for global flag
            return new Promise((resolve) => {
                let attempts = 0;
                const i = setInterval(() => {
                    attempts++;
                    if ((window as any).__FIREBASE_READY__) {
                        clearInterval(i);
                        resolve(true);
                    }
                    if (attempts > 50) { // 5s
                        clearInterval(i);
                        resolve(false);
                    }
                }, 100);
            });
        });
        expect(authReady).toBe(true);
    });
});
