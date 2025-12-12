import { test, expect } from '@playwright/test';

test.describe('Firebase Auth Smoke Test', () => {
    test('should load login page and have Firebase config initialized', async ({ page }) => {
        // Check console for Firebase Init logs - Setup BEFORE navigation
        const logs: string[] = [];
        page.on('console', msg => logs.push(msg.text()));

        // Navigate to login
        const response = await page.goto('http://localhost:3000/login');

        // Allow time for init
        await page.waitForTimeout(1000);

        // Assert initialization logs
        // We look for the new structure we added
        const initLog = logs.find(l => l.includes('[FIREBASE] Initialization Debug') || l.includes('Keys Present:'));
        expect(initLog || logs.some(l => l.includes('Keys Present'))).toBeTruthy();
    });

    test('should validate runtime config injection (simulated)', async ({ page }) => {
        // Verify the json file exists
        const response = await page.goto('http://localhost:3000/firebase-config.json');
        expect(response?.status()).toBe(200);
        const json = await response?.json();
        expect(json).toHaveProperty('apiKey');
        expect(json.apiKey).toBeTruthy();
    });
});

test('should detect WebView environment when Android UserAgent is set', async ({ page }) => {
    // Emulate Android WebView User Agent
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'userAgent', {
            get: () => 'Mozilla/5.0 (Linux; Android 10; SM-G960F Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/81.0.4044.138 Mobile Safari/537.36',
        });
        document.documentElement.classList.add('is-android-webview');
    });

    // Capture logs
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));

    await page.goto('/login');
    await page.waitForTimeout(1000);

    // Assert we triggered the webview logic (look for persistence log)
    const persistenceLog = logs.some(l => l.includes('Persistence set to LOCAL'));

    if (!persistenceLog) {
        console.log('--- ALL LOGS ---');
        logs.forEach(l => console.log(l));
    }

    expect(persistenceLog).toBeTruthy();
});

