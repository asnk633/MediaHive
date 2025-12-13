import { test, expect } from '@playwright/test';

// WebView User Agent presets
const WEBVIEW_UAS = [
  {
    name: 'Android WebView',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 wv'
  },
  {
    name: 'Chrome WebView 81',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G960F Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/81.0.4044.138 Mobile Safari/537.36'
  },
  {
    name: 'Capacitor WebView',
    userAgent: 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36'
  }
];

/**
 * Capture and analyze console logs
 */
async function captureLogs(page: any) {
  const logs: { type: string; text: string }[] = [];
  page.on('console', (msg: any) => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  return logs;
}

/**
 * Check WebView detection
 */
async function checkWebViewDetection(page: any) {
  const webViewInfo = await page.evaluate(() => {
    const ua = navigator.userAgent;
    const isWebView = ua.includes('wv');
    const isCapacitor = !!(window as any).Capacitor;
    const hasWebViewClass = document.documentElement.classList.contains('is-android-webview');
    
    return {
      userAgent: ua,
      isWebView,
      isCapacitor,
      hasWebViewClass
    };
  });
  
  return webViewInfo;
}

/**
 * Check safe-area initialization
 */
async function checkSafeAreaInitialization(page: any) {
  const safeAreaInfo = await page.evaluate(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    
    return {
      safeAreaTop: styles.getPropertyValue('--safe-area-top'),
      safeAreaBottom: styles.getPropertyValue('--safe-area-bottom'),
      computedSafeTop: styles.getPropertyValue('--computed-safe-top'),
      computedSafeBottom: styles.getPropertyValue('--computed-safe-bottom'),
      safeAreaInitialized: !!(window as any).__SAFE_AREA_INITIALIZED,
      clipDetectionAdjusted: !!(window as any).__CLIP_DETECTION_ADJUSTED
    };
  });
  
  return safeAreaInfo;
}

/**
 * Check Firebase initialization and persistence
 */
async function checkFirebaseInitialization(page: any) {
  const firebaseInfo = await page.evaluate(() => {
    const hasFirebase = typeof window !== 'undefined' && 
                       (window as any).firebase && 
                       (window as any).firebase.apps && 
                       (window as any).firebase.apps.length > 0;
                       
    const logs = (window as any).__CONSOLE_LOGS || [];
    const persistenceLog = logs.find((log: string) => log.includes('Persistence set to LOCAL'));
    const firebaseLogs = logs.filter((log: string) => log.includes('[FIREBASE]'));
    
    return {
      hasFirebase,
      persistenceSetToLocal: !!persistenceLog,
      firebaseLogs
    };
  });
  
  return firebaseInfo;
}

/**
 * Check TopBar visibility
 */
async function checkTopBarVisibility(page: any) {
  const topBarInfo = await page.evaluate(() => {
    const topBar = document.querySelector('header.topbar');
    if (!topBar) return null;
    
    const rect = topBar.getBoundingClientRect();
    const styles = getComputedStyle(topBar);
    
    return {
      exists: true,
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      isClipped: rect.top < -4,
      marginTop: styles.marginTop,
      paddingTop: styles.paddingTop
    };
  });
  
  return topBarInfo;
}

test.describe('WebView Emulator Test Suite', () => {
  for (const ua of WEBVIEW_UAS) {
    test(`${ua.name} - Complete WebView Validation`, async ({ page }) => {
      // Set up console log capture
      const logs: { type: string; text: string }[] = [];
      page.on('console', (msg: any) => {
        logs.push({
          type: msg.type(),
          text: msg.text()
        });
      });
      
      // Make logs available globally for evaluation
      await page.addInitScript((capturedLogs) => {
        (window as any).__CONSOLE_LOGS = capturedLogs;
      }, logs);
      
      // Set User Agent
      await page.addInitScript((userAgent) => {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          configurable: true
        });
      }, ua.userAgent);
      
      // Add WebView class if it's a WebView UA
      if (ua.userAgent.includes('wv')) {
        await page.addInitScript(() => {
          document.documentElement.classList.add('is-android-webview');
        });
      }
      
      // Set viewport to typical mobile dimension
      await page.setViewportSize({ width: 412, height: 915 });
      
      // Navigate to home page
      await page.goto('/home');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Wait a bit more for all initialization to complete
      await page.waitForTimeout(2000);
      
      // 1. Check WebView detection
      const webViewInfo = await checkWebViewDetection(page);
      console.log(`\n=== ${ua.name} WebView Detection ===`);
      console.log(`UserAgent: ${webViewInfo.userAgent}`);
      console.log(`IsWebView: ${webViewInfo.isWebView}`);
      console.log(`IsCapacitor: ${webViewInfo.isCapacitor}`);
      console.log(`Has WebView Class: ${webViewInfo.hasWebViewClass}`);
      
      // Validate WebView detection
      expect(webViewInfo.userAgent).toBe(ua.userAgent);
      if (ua.userAgent.includes('wv')) {
        expect(webViewInfo.isWebView).toBe(true);
        expect(webViewInfo.hasWebViewClass).toBe(true);
      }
      
      // 2. Check safe-area initialization
      const safeAreaBefore = await checkSafeAreaInitialization(page);
      console.log(`\n=== ${ua.name} Safe-Area Before ClipDetection ===`);
      console.log(`Safe Area Top: ${safeAreaBefore.safeAreaTop}`);
      console.log(`Safe Area Bottom: ${safeAreaBefore.safeAreaBottom}`);
      console.log(`Computed Safe Top: ${safeAreaBefore.computedSafeTop}`);
      console.log(`Computed Safe Bottom: ${safeAreaBefore.computedSafeBottom}`);
      console.log(`Safe Area Initialized: ${safeAreaBefore.safeAreaInitialized}`);
      
      // Validate safe-area initialization happened before hydration
      expect(safeAreaBefore.safeAreaInitialized).toBe(true);
      expect(safeAreaBefore.safeAreaTop).toBeDefined();
      expect(safeAreaBefore.computedSafeTop).toBeDefined();
      
      // 3. Trigger ClipDetection manually to see adjustments
      await page.evaluate(() => {
        // Manually trigger clip detection to see if adjustments are made
        const event = new Event('resize');
        window.dispatchEvent(event);
      });
      
      // Wait for ClipDetection to run
      await page.waitForTimeout(500);
      
      const safeAreaAfter = await checkSafeAreaInitialization(page);
      console.log(`\n=== ${ua.name} Safe-Area After ClipDetection ===`);
      console.log(`Clip Detection Adjusted: ${safeAreaAfter.clipDetectionAdjusted}`);
      console.log(`Safe Area Top: ${safeAreaAfter.safeAreaTop}`);
      console.log(`Computed Safe Top: ${safeAreaAfter.computedSafeTop}`);
      
      // 4. Check TopBar visibility
      const topBarInfo = await checkTopBarVisibility(page);
      console.log(`\n=== ${ua.name} TopBar Visibility ===`);
      if (topBarInfo) {
        console.log(`TopBar Exists: ${topBarInfo.exists}`);
        console.log(`TopBar Top: ${topBarInfo.top}`);
        console.log(`TopBar Bottom: ${topBarInfo.bottom}`);
        console.log(`TopBar Height: ${topBarInfo.height}`);
        console.log(`Is Clipped: ${topBarInfo.isClipped}`);
        
        // Validate TopBar is visible (not clipped)
        expect(topBarInfo.exists).toBe(true);
        expect(topBarInfo.isClipped).toBe(false);
      } else {
        console.log('TopBar not found');
        expect(topBarInfo).not.toBeNull();
      }
      
      // 5. Check Firebase initialization and persistence
      const firebaseInfo = await checkFirebaseInitialization(page);
      console.log(`\n=== ${ua.name} Firebase Info ===`);
      console.log(`Firebase Initialized: ${firebaseInfo.hasFirebase}`);
      console.log(`Persistence Set to LOCAL: ${firebaseInfo.persistenceSetToLocal}`);
      
      // Print Firebase logs
      if (firebaseInfo.firebaseLogs.length > 0) {
        console.log('Firebase Logs:');
        firebaseInfo.firebaseLogs.forEach((log: string) => console.log(`  ${log}`));
      }
      
      // Validate Firebase initialization
      expect(firebaseInfo.hasFirebase).toBe(true);
      
      // Take screenshot for visual verification
      await page.screenshot({ 
        path: `test-results/webview-${ua.name.toLowerCase().replace(/\s+/g, '-')}-test.png`,
        fullPage: true 
      });
      console.log(`\nScreenshot saved: webview-${ua.name.toLowerCase().replace(/\s+/g, '-')}-test.png`);
    });
  }
  
  test('Capacitor WebView - Session Persistence Test', async ({ page }) => {
    // Set up for Capacitor WebView
    const capacitorUA = 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36';
    
    // Set up console log capture
    const logs: { type: string; text: string }[] = [];
    page.on('console', (msg: any) => {
      logs.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Make logs available globally for evaluation
    await page.addInitScript((capturedLogs) => {
      (window as any).__CONSOLE_LOGS = capturedLogs;
    }, logs);
    
    // Set User Agent
    await page.addInitScript((userAgent) => {
      Object.defineProperty(navigator, 'userAgent', {
        value: userAgent,
        configurable: true
      });
    }, capacitorUA);
    
    // Add WebView class
    await page.addInitScript(() => {
      document.documentElement.classList.add('is-android-webview');
      // Simulate Capacitor being present
      (window as any).Capacitor = { isNativePlatform: () => true };
    });
    
    // Set viewport
    await page.setViewportSize({ width: 412, height: 915 });
    
    // Navigate to home page
    await page.goto('/home');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check Firebase persistence
    const firebaseInfo = await checkFirebaseInitialization(page);
    console.log('\n=== Capacitor WebView - Session Persistence ===');
    console.log(`Persistence Set to LOCAL: ${firebaseInfo.persistenceSetToLocal}`);
    
    // Validate that persistence is set to LOCAL in Capacitor environment
    expect(firebaseInfo.persistenceSetToLocal).toBe(true);
    
    // Simulate page reload (to test persistence)
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check Firebase is still initialized after reload
    const firebaseAfterReload = await checkFirebaseInitialization(page);
    console.log(`Firebase Still Initialized After Reload: ${firebaseAfterReload.hasFirebase}`);
    
    expect(firebaseAfterReload.hasFirebase).toBe(true);
    
    // Print Firebase logs for debugging
    if (firebaseAfterReload.firebaseLogs.length > 0) {
      console.log('Firebase Logs After Reload:');
      firebaseAfterReload.firebaseLogs.forEach((log: string) => console.log(`  ${log}`));
    }
  });
});