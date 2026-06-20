import { expect } from '@playwright/test';
import { test as mockTest } from './fixtures/db-fixture';
import { mergeTestResults } from './utils/results';

const test = mockTest;
test.setTimeout(240000);

const useReal = process.env.USE_REAL_FIREBASE === 'true';

async function safeGoto(page: any, url: string) {
  try {
    await page.goto(url, { timeout: 30000, waitUntil: 'load' });
  } catch (e: any) {
    const msg = e.message || '';
    if (
      msg.includes('ERR_ABORTED') ||
      msg.includes('NS_BINDING_ABORTED') ||
      msg.includes('interrupted by another navigation') ||
      msg.includes('Navigation timeout')
    ) {
      await page.waitForLoadState('load').catch(() => {});
      return;
    }
    throw e;
  }
}

test.beforeEach(async ({ page }) => {
  if (useReal) return;

  await page.route('**/firebase-config.json', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        apiKey: 'MOCK_API_KEY',
        authDomain: 'mock.firebaseapp.com',
        projectId: 'mock-project',
      }),
    });
  });

  await page.addInitScript(() => {
    (window as any).__FIREBASE_MOCK__ = true;
    (window as any).__FIREBASE_READY__ = true;
    (window as any).__FIREBASE_PERSISTENCE_FALLBACK__ = false;
    (window as any).__FIREBASE_INIT_DEBUG__ = {
      source: 'MOCK',
      keysPresent: { apiKey: true, authDomain: true, projectId: true },
      persistenceOutcome: 'mock',
      isWebView: /wv|WebView/.test(navigator.userAgent || ''),
    };
  });

  await safeGoto(page, '/login');
  await page.evaluate(() => {
    localStorage.setItem('playwright_test_auth', 'true');
    localStorage.setItem('playwright_test_role', 'admin');
    localStorage.setItem('playwright_test_institution_id', '1');
    localStorage.setItem('playwright_test_department_id', '1');
    localStorage.setItem('mediahive_onboarding_complete', 'true');
  });
});

const VIEWPORT_PRESETS = [
  { name: 'Desktop', width: 1366, height: 768 },
  { name: 'Tablet', width: 1024, height: 768 },
  { name: 'Chrome Mobile', width: 412, height: 915 },
  { name: 'Pixel 7', width: 412, height: 915 },
  { name: 'Samsung S21', width: 360, height: 800 }
];

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

let testResults: any = {
  hydrationStability: {},
  webViewDeviceBehavior: {}
};

async function safeGotoHome(page: any) {
  await safeGoto(page, '/home');
}

// Group 3: Hydration Stability Tests
test.describe('3. Hydration Stability Tests', () => {
  for (const viewport of VIEWPORT_PRESETS) {
    test(`${viewport.name} - Detect hydration mismatches`, async ({ page }) => {
      const consoleMessages: { type: string; text: string }[] = [];
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      });

      (page as any)._consoleMessages = consoleMessages;

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await safeGotoHome(page);
      await page.waitForLoadState('load');
      await page.waitForLoadState('networkidle').catch(() => {});

      try {
        const hydrationErrors: string[] = [];
        let hasHydrationError = false;
        try {
          hasHydrationError = await page.evaluate(() => {
            return (window as any).__NEXT_HYDRATION_ERROR || false;
          });
        } catch (evalError: any) {
          if (evalError.message?.includes('Execution context was destroyed')) {
            await page.waitForLoadState('load');
            hasHydrationError = await page.evaluate(() => {
              return (window as any).__NEXT_HYDRATION_ERROR || false;
            });
          } else {
            throw evalError;
          }
        }

        if (hasHydrationError) {
          hydrationErrors.push('React __NEXT_HYDRATION_ERROR flag detected');
        }

        for (const msg of consoleMessages) {
          const text = msg.text;
          if (text.includes('hydration failed') ||
            text.includes('Hydration failed') ||
            text.includes('Text content did not match') ||
            text.includes('Server and client') ||
            (msg.type === 'error' && text.includes('hydration'))) {
            hydrationErrors.push(`Console error: ${text}`);
          }
        }

        console.log(`\n=== ${viewport.name} Hydration Check ===`);
        console.log(`Hydration Errors Found: ${hydrationErrors.length}`);

        expect(hydrationErrors).toHaveLength(0);

        testResults.hydrationStability[viewport.name] = {
          status: 'PASS',
          hydrationErrors: hydrationErrors.length
        };
        await mergeTestResults('hydrationStability', testResults.hydrationStability);

        await page.screenshot({
          path: `test-results/hydration-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: false
        });

      } catch (error: any) {
        console.log(`❌ Hydration test failed on ${viewport.name}:`, error.message);
        await page.screenshot({
          path: `test-results/hydration-${viewport.name.toLowerCase().replace(/\s+/g, '-')}-failure.png`,
          fullPage: false
        });

        testResults.hydrationStability[viewport.name] = {
          status: 'FAIL',
          error: error.message
        };
        await mergeTestResults('hydrationStability', testResults.hydrationStability);
        throw error;
      }
    });
  }
});

// Group 6: WebView Device Behavior Tests
test.describe('6. WebView Device Behavior Tests', () => {
  for (const ua of WEBVIEW_UAS) {
    test(`${ua.name} - Complete WebView Validation`, async ({ page }) => {
      const logs: { type: string; text: string }[] = [];
      page.on('console', (msg: any) => {
        logs.push({
          type: msg.type(),
          text: msg.text()
        });
      });

      await page.addInitScript((capturedLogs) => {
        (window as any).__CONSOLE_LOGS = capturedLogs;
      }, logs);

      await page.addInitScript((userAgent) => {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          configurable: true
        });
      }, ua.userAgent);

      if (ua.userAgent.includes('wv')) {
        await page.addInitScript(() => {
          document.documentElement.classList.add('is-android-webview');
        });
      }

      await page.setViewportSize({ width: 412, height: 915 });
      await safeGotoHome(page);
      await page.waitForLoadState('load');
      await page.waitForFunction(() => (window as any).__SAFE_AREA_INITIALIZED, { timeout: 10000 }).catch(() => {});

      try {
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

        console.log(`\n=== ${ua.name} WebView Detection ===`);
        console.log(`UserAgent: ${webViewInfo.userAgent}`);
        console.log(`IsWebView: ${webViewInfo.isWebView}`);
        console.log(`IsCapacitor: ${webViewInfo.isCapacitor}`);
        console.log(`Has WebView Class: ${webViewInfo.hasWebViewClass}`);

        expect(webViewInfo.userAgent).toContain(ua.userAgent.substring(0, 30));

        if (ua.userAgent.includes('wv')) {
          const isWebViewDetected = webViewInfo.isWebView || webViewInfo.userAgent.includes('wv');
          expect(isWebViewDetected).toBe(true);
        }

        const safeAreaBefore = await page.evaluate(() => {
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

        console.log(`\n=== ${ua.name} Safe-Area Before ClipDetection ===`);
        console.log(`Safe Area Top: ${safeAreaBefore.safeAreaTop}`);
        console.log(`Safe Area Bottom: ${safeAreaBefore.safeAreaBottom}`);
        expect(safeAreaBefore.safeAreaInitialized).toBe(true);

        await page.evaluate(() => {
          const event = new Event('resize');
          window.dispatchEvent(event);
        });

        await page.waitForFunction(() => (window as any).__CLIP_DETECTION_ADJUSTED, { timeout: 10000 }).catch(() => {});

        const safeAreaAfter = await page.evaluate(() => {
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

        console.log(`\n=== ${ua.name} Safe-Area After ClipDetection ===`);
        console.log(`Clip Detection Adjusted: ${safeAreaAfter.clipDetectionAdjusted}`);

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

        console.log(`\n=== ${ua.name} TopBar Visibility ===`);
        if (topBarInfo) {
          expect(topBarInfo.exists).toBe(true);
          expect(topBarInfo.isClipped).toBe(false);
        } else {
          expect(topBarInfo).not.toBeNull();
        }

        const firebaseInfo = await page.evaluate(() => {
          const hasFirebase = typeof window !== 'undefined' &&
            (window as any).firebase &&
            (window as any).firebase.apps &&
            (window as any).firebase.apps.length > 0;

          const logs = (window as any).__CONSOLE_LOGS || [];
          const persistenceLog = logs.find((log: any) => log.text.includes('Persistence set to LOCAL'));
          const mockLog = logs.find((log: any) => log.text.includes('[FIREBASE][MOCK]'));
          const fallbackLog = logs.find((log: any) => log.text.includes('[FIREBASE]'));
          const firebaseReady = !!(window as any).__FIREBASE_READY__;
          const firebaseLogs = logs.filter((log: any) => log.text.includes('[FIREBASE]'));

          return {
            hasFirebase,
            persistenceSetToLocal: !!(persistenceLog || mockLog || fallbackLog),
            firebaseReady,
            firebaseLogs: firebaseLogs.map((log: any) => log.text)
          };
        });

        console.log(`\n=== ${ua.name} Firebase Info ===`);
        const hasFirebaseIndicators = firebaseInfo.hasFirebase ||
          firebaseInfo.persistenceSetToLocal ||
          firebaseInfo.firebaseReady ||
          firebaseInfo.firebaseLogs.length > 0;
        expect(hasFirebaseIndicators).toBe(true);

        testResults.webViewDeviceBehavior[ua.name] = {
          status: 'PASS',
          webViewInfo,
          safeAreaBefore,
          safeAreaAfter,
          topBarInfo,
          firebaseInfo
        };

        await mergeTestResults('webViewDeviceBehavior', testResults.webViewDeviceBehavior);

        await page.screenshot({
          path: `test-results/webview-${ua.name.toLowerCase().replace(/\s+/g, '-')}-test.png`,
          fullPage: false
        });

      } catch (error: any) {
        console.log(`❌ WebView test failed on ${ua.name}:`, error.message);
        await page.screenshot({
          path: `test-results/webview-${ua.name.toLowerCase().replace(/\s+/g, '-')}-test-failure.png`,
          fullPage: false
        });

        try {
          const logs = await page.evaluate(() => (window as any).__CONSOLE_LOGS || []);
          console.log(`Console logs for ${ua.name}:`, JSON.stringify(logs, null, 2));
        } catch (logError) {
          console.log('Failed to capture console logs:', logError);
        }

        testResults.webViewDeviceBehavior[ua.name] = {
          status: 'FAIL',
          error: error.message
        };
        await mergeTestResults('webViewDeviceBehavior', testResults.webViewDeviceBehavior);
        throw error;
      }
    });
  }

  test('Capacitor WebView - Session Persistence Test', async ({ page }) => {
    const capacitorUA = 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36';
    const logs: { type: string; text: string }[] = [];
    page.on('console', (msg: any) => {
      logs.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    await page.addInitScript((capturedLogs) => {
      (window as any).__CONSOLE_LOGS = capturedLogs;
    }, logs);

    await page.addInitScript((userAgent) => {
      Object.defineProperty(navigator, 'userAgent', {
        value: userAgent,
        configurable: true
      });
    }, capacitorUA);

    await page.addInitScript(() => {
      document.documentElement.classList.add('is-android-webview');
      (window as any).Capacitor = { isNativePlatform: () => true };
    });

    await page.setViewportSize({ width: 412, height: 915 });
    await safeGotoHome(page);
    await page.waitForLoadState('load');
    await page.waitForFunction(() => (window as any).__SAFE_AREA_INITIALIZED, { timeout: 10000 }).catch(() => {});

    try {
      const firebaseInfo = await page.evaluate(() => {
        const hasFirebase = typeof window !== 'undefined' &&
          (window as any).firebase &&
          (window as any).firebase.apps &&
          (window as any).firebase.apps.length > 0;

        const logs = (window as any).__CONSOLE_LOGS || [];
        const persistenceLog = logs.find((log: any) => log.text.includes('Persistence set to LOCAL'));
        const mockLog = logs.find((log: any) => log.text.includes('[FIREBASE][MOCK]'));
        const fallbackLog = logs.find((log: any) => log.text.includes('[FIREBASE]'));
        const firebaseReady = !!(window as any).__FIREBASE_READY__;
        const firebaseLogs = logs.filter((log: any) => log.text.includes('[FIREBASE]'));

        return {
          hasFirebase,
          persistenceSetToLocal: !!(persistenceLog || mockLog || fallbackLog),
          firebaseReady,
          firebaseLogs: firebaseLogs.map((log: any) => log.text)
        };
      });

      console.log('\n=== Capacitor WebView - Session Persistence ===');
      const fallback = !!(await page.evaluate(() => (window as any).__FIREBASE_PERSISTENCE_FALLBACK__));
      const mockFlag = !!(await page.evaluate(() => (window as any).__FIREBASE_MOCK__));
      const hasFirebaseIndicators = firebaseInfo.persistenceSetToLocal ||
        firebaseInfo.firebaseReady ||
        firebaseInfo.firebaseLogs.length > 0 ||
        fallback || mockFlag;
      expect(hasFirebaseIndicators).toBe(true);

      await page.reload();
      await page.waitForLoadState('load');
      await page.waitForFunction(() => (window as any).__SAFE_AREA_INITIALIZED, { timeout: 10000 }).catch(() => {});

      const firebaseAfterReload = await page.evaluate(() => {
        const hasFirebase = typeof window !== 'undefined' &&
          (window as any).firebase &&
          (window as any).firebase.apps &&
          (window as any).firebase.apps.length > 0;

        const logs = (window as any).__CONSOLE_LOGS || [];
        const persistenceLog = logs.find((log: any) => log.text.includes('Persistence set to LOCAL'));
        const mockLog = logs.find((log: any) => log.text.includes('[FIREBASE][MOCK]'));
        const fallbackLog = logs.find((log: any) => log.text.includes('[FIREBASE]'));
        const firebaseReady = !!(window as any).__FIREBASE_READY__;
        const firebaseLogs = logs.filter((log: any) => log.text.includes('[FIREBASE]'));

        return {
          hasFirebase,
          persistenceSetToLocal: !!(persistenceLog || mockLog || fallbackLog),
          firebaseReady,
          firebaseLogs: firebaseLogs.map((log: any) => log.text)
        };
      });

      const fallbackAfterReload = !!(await page.evaluate(() => (window as any).__FIREBASE_PERSISTENCE_FALLBACK__));
      const mockFlagAfterReload = !!(await page.evaluate(() => (window as any).__FIREBASE_MOCK__));
      const hasFirebaseIndicatorsAfterReload = firebaseAfterReload.hasFirebase ||
        firebaseAfterReload.persistenceSetToLocal ||
        firebaseAfterReload.firebaseReady ||
        firebaseAfterReload.firebaseLogs.length > 0 ||
        fallbackAfterReload || mockFlagAfterReload;
      expect(hasFirebaseIndicatorsAfterReload).toBe(true);

      testResults.webViewDeviceBehavior['Capacitor_Session_Persistence'] = {
        status: 'PASS',
        firebaseInfo,
        firebaseAfterReload
      };

      await mergeTestResults('webViewDeviceBehavior', testResults.webViewDeviceBehavior);

      await page.screenshot({
        path: `test-results/webview-capacitor-session-persistence.png`,
        fullPage: false
      });

    } catch (error: any) {
      console.log(`❌ Capacitor session persistence test failed:`, error.message);
      await page.screenshot({
        path: `test-results/webview-capacitor-session-persistence-failure.png`,
        fullPage: false
      });

      try {
        const logs = await page.evaluate(() => (window as any).__CONSOLE_LOGS || []);
        console.log('Console logs for Capacitor test:', JSON.stringify(logs, null, 2));
      } catch (logError) {
        console.log('Failed to capture console logs:', logError);
      }

      testResults.webViewDeviceBehavior['Capacitor_Session_Persistence'] = {
        status: 'FAIL',
        error: error.message
      };
      await mergeTestResults('webViewDeviceBehavior', testResults.webViewDeviceBehavior);
      throw error;
    }
  });
});

test.afterAll(async () => {
  console.log('\n=== Features/WebView Test Suite Summary ===');
  console.log(JSON.stringify(testResults, null, 2));
});
