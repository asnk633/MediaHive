// mockFirebase fixture for Playwright
import { test as base } from '@playwright/test';

// Extend the Window interface to include our custom properties
declare global {
  interface Window {
    __FIREBASE_MOCK__: boolean;
    __FIREBASE_READY__: boolean;
    __FIREBASE_INIT_DEBUG__: any;
    __FIREBASE_PERSISTENCE_FALLBACK__: boolean;
    mockSetFirebaseReady: () => void;
  }
}

// A small fixture that intercepts /firebase-config.json requests and stubs firebase init behavior.
export const test = base.extend<{
  mockFirebase: boolean;
}>({
  mockFirebase: async ({ page }, use, testInfo) => {
    // If environment explicitly requests real Firebase, do nothing
    const useReal = process.env.USE_REAL_FIREBASE === 'true' || false;
    if (useReal) {
      await use(false);
      return;
    }

    // Intercept config fetch and return a valid stub if asked
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

    // Provide a minimal in-page mock for firebase initialization
    await page.addInitScript(() => {
      // Provide a simple init shim if real firebase not used
      window.__FIREBASE_MOCK__ = true;
      window.mockSetFirebaseReady = function () {
        window.__FIREBASE_READY__ = true;
        window.__FIREBASE_INIT_DEBUG__ = { source: 'MOCK', keysPresent: { apiKey: true } };
        window.__FIREBASE_PERSISTENCE_FALLBACK__ = false;
        console && console.log && console.log('[FIREBASE][MOCK] ready');
      };
    });

    await use(true);
  },
});

export { expect } from '@playwright/test';