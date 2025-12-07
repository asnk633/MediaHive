// scripts/generateStorageState.js
// Usage:
// BASE_URL='http://127.0.0.1:3000' E2E_TEST_EMAIL='smoke@test.local' E2E_TEST_PW='Pass123' node scripts/generateStorageState.js

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const email = process.env.E2E_TEST_EMAIL || 'smoke@test.local';
const pw = process.env.E2E_TEST_PW || 'Pass123';
const out = path.join(__dirname, '..', 'e2e', 'storageState.json');

(async () => {
    console.log('Generating storage state for', email, '->', out);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto(baseUrl + '/login', { waitUntil: 'networkidle' });
        // adapt selectors if your login form differs
        // Using ID selectors as per src/app/login/page.tsx
        await page.fill('input[id="email"]', email);
        await page.fill('input[id="password"]', pw);
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => { }),
            page.click('button[type="submit"]'),
        ]);

        // optional check
        const url = page.url();
        console.log('After login, url:', url);

        // save storage state
        await context.storageState({ path: out });
        console.log('Saved storage state to', out);
        await browser.close();
        process.exit(0);
    } catch (err) {
        console.error('Auth generation failed:', err);
        await browser.close();
        process.exit(2);
    }
})();
