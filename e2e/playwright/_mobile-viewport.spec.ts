import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Safe Area & Mobile Viewport Validation', () => {
    test.beforeEach(async ({ page }) => {
        // Inject debug script
        await page.addInitScript({ path: path.join(__dirname, '../../scripts/debug-safe-areas.js') });
    });

    test('TopBar should respect safe area top', async ({ page }) => {
        await page.goto('/home');
        const topBar = page.locator('.topbar');
        await expect(topBar).toBeVisible();

        // Evaluate Computed Styles
        const safeAreaTop = await page.evaluate(() => {
            const val = getComputedStyle(document.documentElement).getPropertyValue('--computed-safe-top');
            return parseFloat(val) || 0;
        });

        // TopBar usually handles safe area via `top` position or padding
        // In our CSS: .topbar { top: var(--computed-safe-top) }
        const topBarTop = await topBar.evaluate((el) => {
            const style = getComputedStyle(el);
            return parseFloat(style.top);
        });

        console.log(`[Safe Area] Computed Safe Top: ${safeAreaTop}px`);
        console.log(`[Safe Area] TopBar Top Style: ${topBarTop}px`);

        // If safeAreaTop is set, TopBar should use it
        // Note: Playwright doesn't automatically emulate "notches" unless we use specific device descriptors 
        // that have visual viewports, but purely checking the logic relies on us setting the variable or the browser mocking it.
        // Since we can't easily force 'env(safe-area-inset-top)' in headless without specific flags, 
        // we mainly check that the CSS Logic connects:
        // TopBar.top == computed-safe-top
        expect(topBarTop).toBe(safeAreaTop);
    });

    test('BottomNav should padding-bottom for safe area', async ({ page }) => {
        await page.goto('/home');
        const bottomNav = page.locator('.bottom-nav');

        // CSS: height: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
        // We can't easily mock env() but we can check if the element exists and is at the bottom.
        const box = await bottomNav.boundingBox();
        const viewport = await page.viewportSize();

        if (!box || !viewport) throw new Error('Missing viewport or box');

        // Should be at the bottom
        expect(box.y + box.height).toBeCloseTo(viewport.height, 1);
    });

    test('Content Offset should include TopBar height + safe area', async ({ page }) => {
        await page.goto('/home');

        // Wait for hydration to settle logic
        await page.waitForTimeout(500);

        const contentOffset = page.locator('.content-offset');
        await expect(contentOffset).toBeVisible();

        const metrics = await page.evaluate(() => {
            const root = getComputedStyle(document.documentElement);
            const topBarH = parseFloat(root.getPropertyValue('--topbar-height')) || 0;
            const safeTop = parseFloat(root.getPropertyValue('--computed-safe-top')) || 0;

            const el = document.querySelector('.content-offset');
            const paddingTop = parseFloat(getComputedStyle(el).paddingTop);

            return { topBarH, safeTop, paddingTop };
        });

        console.log('[Safe Area] Content Offset Metrics:', metrics);

        const expectedPadding = metrics.topBarH + metrics.safeTop;
        expect(metrics.paddingTop).toBeCloseTo(expectedPadding, 1);
    });
});
