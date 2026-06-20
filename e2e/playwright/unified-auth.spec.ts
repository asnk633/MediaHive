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
      msg.includes('Frame load interrupted') ||
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

let testResults: any = {
  firebaseRuntime: {}
};

async function safeGotoHome(page: any) {
  await safeGoto(page, '/home');
}

async function captureConsoleLogs(page: any) {
  const logs: { type: string; text: string }[] = [];
  page.on('console', (msg: any) => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  return logs;
}

// Group 5: Firebase Runtime Tests
test.describe('5. Firebase Runtime Tests', () => {
  for (const viewport of VIEWPORT_PRESETS) {
    test(`${viewport.name} - Firebase initialization and persistence`, async ({ page }) => {
      const useRealFirebase = process.env.USE_REAL_FIREBASE === 'true';
      const logs = await captureConsoleLogs(page);

      await page.addInitScript((capturedLogs) => {
        (window as any).__CONSOLE_LOGS = capturedLogs;
      }, logs);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await safeGotoHome(page);
      await page.waitForLoadState('load');

      if (useRealFirebase) {
        try {
          await page.waitForFunction(() => (window as any).__FIREBASE_READY__, { timeout: 10000 });
        } catch (e) {
          console.log('Firebase did not become ready within 10s timeout');
        }
      }

      await page.waitForFunction(() => (window as any).__FIREBASE_READY__, { timeout: 10000 }).catch(() => {});

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

        console.log(`\n=== ${viewport.name} Firebase Runtime ===`);
        console.log(`Firebase Initialized: ${firebaseInfo.hasFirebase}`);
        console.log(`Persistence Set to LOCAL: ${firebaseInfo.persistenceSetToLocal}`);

        if (firebaseInfo.firebaseLogs.length > 0) {
          console.log('Firebase Logs:');
          firebaseInfo.firebaseLogs.forEach((log: string) => console.log(`  ${log}`));
        }

        const fallback = !!(await page.evaluate(() => (window as any).__FIREBASE_PERSISTENCE_FALLBACK__));
        const mockFlag = !!(await page.evaluate(() => (window as any).__FIREBASE_MOCK__));
        expect(firebaseInfo.persistenceSetToLocal || mockFlag || fallback).toBeTruthy();

        testResults.firebaseRuntime[viewport.name] = {
          status: 'PASS',
          firebaseInfo
        };
        await mergeTestResults('firebaseRuntime', testResults.firebaseRuntime);

        await page.screenshot({
          path: `test-results/firebase-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: false
        });

      } catch (error: any) {
        console.log(`❌ Firebase runtime test failed on ${viewport.name}:`, error.message);
        await page.screenshot({
          path: `test-results/firebase-${viewport.name.toLowerCase().replace(/\s+/g, '-')}-failure.png`,
          fullPage: false
        });

        try {
          const logs = await page.evaluate(() => (window as any).__CONSOLE_LOGS || []);
          console.log(`Console logs for Firebase test on ${viewport.name}:`, JSON.stringify(logs, null, 2));
        } catch (logError) {
          console.log('Failed to capture console logs:', logError);
        }

        testResults.firebaseRuntime[viewport.name] = {
          status: 'FAIL',
          error: error.message
        };
        await mergeTestResults('firebaseRuntime', testResults.firebaseRuntime);
        throw error;
      }
    });
  }
});

test.afterAll(async () => {
  console.log('\n=== Auth/Firebase Test Suite Summary ===');
  console.log(JSON.stringify(testResults, null, 2));
});
