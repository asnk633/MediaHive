import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Greeting Position Validation', () => {
    test.beforeEach(async ({ page }) => {
        // Inject the debug script helper
        await page.addInitScript({ path: path.join(__dirname, '../../scripts/debug-safe-areas.js') });
    });

    /*
     * Rule: Greeting must appear immediately below TopBar.
     * Vertical gap: 0 <= (greeting.top - topbar.bottom) <= 48
     */
    test('Greeting should be positioned correctly below TopBar', async ({ page, viewport }) => {
        await page.goto('/home');

        // Wait for critical elements
        const topBar = page.locator('.topbar');
        const greetingHeader = page.locator('header h1', { hasText: /Good (Morning|Afternoon|Evening)/ });

        await expect(topBar).toBeVisible();
        await expect(greetingHeader).toBeVisible();

        // Get Bounding Rects
        const topBarBox = await topBar.boundingBox();
        const greetingBox = await greetingHeader.boundingBox();

        if (!topBarBox || !greetingBox) {
            throw new Error('Could not get bounding box for TopBar or Greeting');
        }

        console.log(`[Validation] Viewport: ${viewport?.width}x${viewport?.height}`);
        console.log(`[Validation] TopBar Bottom: ${topBarBox.y + topBarBox.height}`);
        console.log(`[Validation] Greeting Top: ${greetingBox.y}`);

        const gap = greetingBox.y - (topBarBox.y + topBarBox.height);
        console.log(`[Validation] Gap: ${gap}px`);

        // Check 1: Greeting must be below TopBar
        expect(gap).toBeGreaterThanOrEqual(-1); // Allow slight sub-pixel rounding tolerance (-1)

        // Check 2: Gap must not exceed 48px
        expect(gap).toBeLessThanOrEqual(48);

        // Check 3: Check visibility (above fold)
        // At least the top of the greeting should be visible without scrolling
        expect(greetingBox.y).toBeLessThan(viewport?.height || 1000);

        // Check 4: No Overlap (Gap >= 0 covers this mostly, but ensure top is strictly >= bottom)
        expect(greetingBox.y).toBeGreaterThanOrEqual(topBarBox.y + topBarBox.height - 1);
    });
});
