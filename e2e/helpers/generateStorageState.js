const { chromium } = require('@playwright/test');
(async () => {
    if (!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PW) {
        console.error("Set E2E_TEST_EMAIL and E2E_TEST_PW env vars before running this helper.");
        process.exit(2);
    }
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL);
    await page.fill('input[name="password"]', process.env.E2E_TEST_PW);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.context().storageState({ path: 'e2e/storage/globalStorageState.json' });
    console.log('Saved storageState to e2e/storage/globalStorageState.json');
    await browser.close();
})();
