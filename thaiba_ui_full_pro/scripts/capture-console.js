// scripts/capture-console.js
import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    console.log('Starting browser to capture console logs...');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const logStream = fs.createWriteStream('browser_logs.txt');

    page.on('console', msg => {
        const text = `[${msg.type()}] ${msg.text()}`;
        console.log(text);
        logStream.write(text + '\n');
    });
    page.on('pageerror', err => {
        const text = `[ERROR] ${err.message}`;
        console.log(text);
        logStream.write(text + '\n');
    });

    page.on('requestfailed', request => {
        // Ignore favicon/manifest errors
        if (!request.url().includes('favicon') && !request.url().includes('manifest')) {
            const text = `[REQUEST_FAILED] ${request.url()} - ${request.failure()?.errorText || 'unknown'}`;
            console.log(text);
            logStream.write(text + '\n');
        }
    });

    try {
        console.log('Navigating to http://127.0.0.1:3001 ...');
        await page.goto('http://127.0.0.1:3001', { timeout: 10000 });
        // Wait a bit to let scripts run/fail
        await page.waitForTimeout(3000);
    } catch (e) {
        console.log('Navigation error (might be okay if page just crashed):', e.message);
    }

    console.log('Capturing screenshot...');
    await page.screenshot({ path: 'debug-white-screen.png' });

    await browser.close();
    logStream.end();
    console.log('Done.');
})();
