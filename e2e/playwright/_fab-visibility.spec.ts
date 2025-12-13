import { test, expect } from '@playwright/test';

// Define viewports to test
const VIEWPORTS = [
  { name: 'Desktop', width: 1366, height: 768 },
  { name: 'Tablet', width: 1024, height: 768 },
  { name: 'Chrome Mobile', width: 412, height: 915 },
  { name: 'Pixel 7', width: 412, height: 915 }, // Same dimensions as Chrome Mobile
  { name: 'Samsung S21', width: 360, height: 800 }
];

// UI invariants to check when FAB is not visible or clipped
async function analyzeUIInvariants(page: any) {
  // Check CSS variables
  const bottomNavHeight = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-height').trim();
  });
  
  const fabOffset = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--fab-offset').trim();
  });
  
  // Check FAB transform/translate values
  const fabTransform = await page.locator('.fab-root').evaluate((el: HTMLElement) => {
    return getComputedStyle(el).transform;
  });
  
  // Check z-index stacking context
  const fabZIndex = await page.locator('.fab-root').evaluate((el: HTMLElement) => {
    return getComputedStyle(el).zIndex;
  });
  
  const bottomNavZIndex = await page.locator('.bottom-nav').evaluate((el: HTMLElement) => {
    return getComputedStyle(el).zIndex;
  });
  
  // Check overlay layers if present
  const overlayExists = await page.locator('.fab-overlay, .fixed.inset-0').first().isVisible();
  
  console.log('UI Invariants Analysis:');
  console.log('- --bottom-nav-height:', bottomNavHeight);
  console.log('- --fab-offset:', fabOffset);
  console.log('- FAB transform:', fabTransform);
  console.log('- FAB z-index:', fabZIndex);
  console.log('- BottomNav z-index:', bottomNavZIndex);
  console.log('- Overlay exists:', overlayExists);
}

test.describe('FAB Visibility Across Devices', () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} - FAB visibility and positioning`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Navigate to tasks page where FAB is typically visible
      await page.goto('/tasks');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Locate FAB and BottomNav elements
      const fab = page.locator('.fab-root');
      const bottomNav = page.locator('.bottom-nav');
      
      try {
        // Test 1: Verify FAB exists in DOM and is visible
        await expect(fab).toBeVisible({ timeout: 10000 });
        console.log(`✓ FAB is visible on ${viewport.name}`);
        
        // Test 2: Verify BottomNav exists
        await expect(bottomNav).toBeVisible({ timeout: 10000 });
        console.log(`✓ BottomNav is visible on ${viewport.name}`);
        
        // Get bounding boxes
        const fabBox = await fab.boundingBox();
        const navBox = await bottomNav.boundingBox();
        
        if (!fabBox || !navBox) {
          throw new Error('Could not get bounding boxes for FAB or BottomNav');
        }
        
        // Test 3: Verify FAB is not clipped or visually hidden behind BottomNav
        // FAB should be above BottomNav (higher z-index and positioned correctly)
        expect(fabBox.y).toBeLessThan(navBox.y, `FAB should be positioned above BottomNav on ${viewport.name}`);
        console.log(`✓ FAB is positioned above BottomNav on ${viewport.name}`);
        
        // Test 4: Validate FAB position - Y position at least 2px above BottomNav height
        const fabBottom = fabBox.y + fabBox.height;
        const navTop = navBox.y;
        expect(fabBottom).toBeLessThanOrEqual(navTop - 2, 
          `FAB should be at least 2px above BottomNav on ${viewport.name}. FAB bottom: ${fabBottom}, Nav top: ${navTop}`);
        console.log(`✓ FAB is positioned correctly above BottomNav on ${viewport.name}`);
        
        // Test 5: Validate FAB is centered horizontally
        const viewportCenterX = viewport.width / 2;
        const fabCenterX = fabBox.x + (fabBox.width / 2);
        const horizontalOffset = Math.abs(fabCenterX - viewportCenterX);
        
        // Allow for small tolerance (2px) due to rounding
        expect(horizontalOffset).toBeLessThan(3, 
          `FAB should be centered horizontally on ${viewport.name}. Offset: ${horizontalOffset}px`);
        console.log(`✓ FAB is horizontally centered on ${viewport.name} (offset: ${horizontalOffset}px)`);
        
        // Additional validation: FAB should be within viewport bounds
        expect(fabBox.x).toBeGreaterThanOrEqual(0);
        expect(fabBox.y).toBeGreaterThanOrEqual(0);
        expect(fabBox.x + fabBox.width).toBeLessThanOrEqual(viewport.width);
        expect(fabBox.y + fabBox.height).toBeLessThanOrEqual(viewport.height);
        console.log(`✓ FAB is within viewport bounds on ${viewport.name}`);
        
      } catch (error) {
        // If any test fails, capture screenshot and analyze UI invariants
        console.log(`❌ Test failed on ${viewport.name}:`, error.message);
        
        // Capture screenshot on failure
        await page.screenshot({ 
          path: `test-results/fab-visibility-${viewport.name.toLowerCase().replace(/\s+/g, '-')}-failure.png`,
          fullPage: true 
        });
        console.log(`Screenshot saved: fab-visibility-${viewport.name.toLowerCase().replace(/\s+/g, '-')}-failure.png`);
        
        // Analyze UI invariants
        await analyzeUIInvariants(page);
        
        // Re-throw the error to fail the test
        throw error;
      }
    });
  }
  
  test('FAB interaction test', async ({ page }) => {
    // Test on a mobile viewport
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
    
    const fab = page.locator('.fab-root');
    await expect(fab).toBeVisible();
    
    // Click FAB to open menu
    await fab.locator('.fab-main').click();
    
    // Check that menu opens
    const fabMenu = fab.locator('.fab-menu.open');
    await expect(fabMenu).toBeVisible({ timeout: 5000 });
    console.log('✓ FAB menu opens correctly');
    
    // Check menu items
    const menuItems = await fabMenu.locator('.fab-menu-item').count();
    expect(menuItems).toBeGreaterThanOrEqual(1);
    console.log(`✓ FAB menu has ${menuItems} items`);
    
    // Close menu by clicking FAB again
    await fab.locator('.fab-main').click();
    await expect(fabMenu).not.toBeVisible({ timeout: 5000 });
    console.log('✓ FAB menu closes correctly');
  });
});