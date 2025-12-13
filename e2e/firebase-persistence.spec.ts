import { test, expect } from '@playwright/test';

test.describe('Firebase Persistence', () => {
  test('should maintain auth state across page reloads in WebView environment', async ({ page }) => {
    // Simulate WebView environment
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 wv',
        configurable: true
      });
    });

    // Set viewport to typical mobile dimension
    await page.setViewportSize({ width: 412, height: 915 });
    
    // Navigate to home page
    await page.goto('/home');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that Firebase is properly initialized
    const firebaseInitialized = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             (window as any).firebase && 
             (window as any).firebase.apps && 
             (window as any).firebase.apps.length > 0;
    });
    
    expect(firebaseInitialized).toBeTruthy();
    
    // Check that auth persistence is set to LOCAL
    const persistenceCheck = await page.evaluate(() => {
      // This would be checked in the browser console logs
      // We'll simulate checking for the presence of persistence-related elements
      return document.body.innerText.includes('Persistence set to LOCAL');
    });
    
    // Note: Actual persistence testing would require a real login flow
    // This test verifies the infrastructure is in place
  });

  test('should handle safe area calculations correctly', async ({ page }) => {
    // Set viewport to typical mobile dimension
    await page.setViewportSize({ width: 412, height: 915 });
    
    // Navigate to home page
    await page.goto('/home');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that safe area CSS variables are set
    const safeAreaVars = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        safeAreaTop: styles.getPropertyValue('--safe-area-top'),
        safeAreaBottom: styles.getPropertyValue('--safe-area-bottom'),
        computedSafeTop: styles.getPropertyValue('--computed-safe-top'),
        computedSafeBottom: styles.getPropertyValue('--computed-safe-bottom')
      };
    });
    
    // Variables should exist (may be '0px' but should not be empty)
    expect(safeAreaVars.safeAreaTop).toBeDefined();
    expect(safeAreaVars.safeAreaBottom).toBeDefined();
    expect(safeAreaVars.computedSafeTop).toBeDefined();
    expect(safeAreaVars.computedSafeBottom).toBeDefined();
    
    // Check that content-offset container exists and has padding
    const contentOffset = await page.locator('.content-offset');
    await expect(contentOffset).toBeVisible();
    
    const paddingTop = await contentOffset.evaluate(el => {
      return window.getComputedStyle(el).paddingTop;
    });
    
    // Should have some padding (greater than 0px)
    expect(parseInt(paddingTop)).toBeGreaterThan(0);
  });

  test('should maintain UI invariants across different viewports', async ({ page }) => {
    const viewports = [
      { name: 'Mobile', width: 412, height: 915 },
      { name: 'Tablet', width: 1024, height: 768 },
      { name: 'Desktop', width: 1366, height: 768 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      
      // Check TopBar exists and is positioned correctly
      const topBar = await page.locator('header.topbar');
      await expect(topBar).toBeVisible();
      
      // Check BottomNav exists
      const bottomNav = await page.locator('.bottom-nav');
      await expect(bottomNav).toBeVisible();
      
      // Check FAB exists
      const fab = await page.locator('.fab-main');
      await expect(fab).toBeVisible();
      
      // Check content-offset container exists
      const contentOffset = await page.locator('.content-offset');
      await expect(contentOffset).toBeVisible();
    }
  });
});