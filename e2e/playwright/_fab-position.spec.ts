import { test, expect } from '@playwright/test';

test.describe('Layout & FAB Positioning', () => {
    // Use a mobile viewport to test the critical overlap case/safe-areas
    test.use({ viewport: { width: 375, height: 812 } });

    test('FAB should be positioned correctly relative to BottomNav', async ({ page }) => {
        await page.goto('http://localhost:3000/tasks');

        // Wait for critical elements
        const fab = page.locator('.fab-root');
        const bottomNav = page.locator('.bottom-nav');

        await expect(fab).toBeVisible();
        await expect(bottomNav).toBeVisible();

        // Get bounding boxes
        const fabBox = await fab.boundingBox();
        const navBox = await bottomNav.boundingBox();

        expect(fabBox).not.toBeNull();
        expect(navBox).not.toBeNull();

        if (fabBox && navBox) {
            // Check Horizontal Center
            // FAB center X should be roughly equal to Viewport center X
            const viewportWidth = page.viewportSize()?.width || 375;
            const fabCenterX = fabBox.x + fabBox.width / 2;
            expect(Math.abs(fabCenterX - viewportWidth / 2)).toBeLessThan(2); // 2px tolerance

            // Check Vertical Overlap
            // FAB bottom should be 'inside' the nav area somewhat, but FAB top should be 'above' the nav top
            // Based on our CSS: bottom is around 44px + safe area. Nav height is 80px + safe area.
            // So FAB sits on top of the nav.
            // Let's just verify FAB is effectively "above" (z-index) and visually overlapping the top edge

            const navTop = navBox.y;
            const fabBottom = fabBox.y + fabBox.height;
            const fabTop = fabBox.y;

            // The FAB bottom > Nav top (it overlaps downwards into the nav)
            expect(fabBottom).toBeGreaterThan(navTop);

            // The FAB top < Nav top (it sticks out above the nav)
            expect(fabTop).toBeLessThan(navTop);

            // Check it's not COMPLETELY covering the nav (bottom edge of FAB shouldn't be below bottom edge of Nav)
            // Actually strictly speaking it could if it was huge, but typically it floats on the edge.
            // Our Logic: Bottom of FAB is ~48px from viewport bottom. Nav bottom is 0px from viewport bottom.
            // So FAB is strictly above the bottom edge of the screen.
            const viewportHeight = page.viewportSize()?.height || 812;
            expect(fabBottom).toBeLessThan(viewportHeight);
        }
    });

    test('TopBar should be sticky and content not obscured', async ({ page }) => {
        await page.goto('http://localhost:3000/tasks');

        const topbar = page.locator('.topbar');
        await expect(topbar).toBeVisible();

        // Check that body or shell padding prevents content from being hidden behind header
        // We can check the first main content element's Y position
        const contentHeading = page.locator('h1, h2').first();
        if (await contentHeading.count() > 0) {
            const headingBox = await contentHeading.boundingBox();
            const topbarBox = await topbar.boundingBox();

            if (headingBox && topbarBox) {
                // Heading top should be >= TopBar bottom
                expect(headingBox.y).toBeGreaterThanOrEqual(topbarBox.y + topbarBox.height);
            }
        }
    });
});
