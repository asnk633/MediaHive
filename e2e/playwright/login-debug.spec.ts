import { test, expect } from '@playwright/test';
import fs from 'fs';

test('login debug', async ({ page }) => {
    fs.writeFileSync('login_debug.log', 'Start\n');

    page.on('console', msg => fs.appendFileSync('login_debug.log', `CONSOLE: ${msg.text()}\n`));
    page.on('pageerror', err => fs.appendFileSync('login_debug.log', `PAGE ERROR: ${err.toString()}\n`));
    page.on('requestfailed', request => fs.appendFileSync('login_debug.log', `REQ FAILED: ${request.url()} ${request.failure()?.errorText}\n`));

    await page.goto('/tasks');
    fs.appendFileSync('login_debug.log', `Initial URL: ${page.url()}\n`);

    if (page.url().includes('login')) {
        await page.fill('input[type="email"]', 'admin@thaiba.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');

        // Listen for login request
        page.on('response', response => {
            if (response.url().includes('/api/auth') || response.url().includes('verifyPassword')) {
                fs.appendFileSync('login_debug.log', `RESPONSE: ${response.url()} status=${response.status()}\n`);
            }
        });

        await page.click('button[type="submit"]');

        fs.appendFileSync('login_debug.log', 'Clicked submit\n');

        // Wait 5s and check URL
        await page.waitForTimeout(5000);
        fs.appendFileSync('login_debug.log', `URL after 5s: ${page.url()}\n`);

        if (page.url().includes('login')) {
            fs.appendFileSync('login_debug.log', 'Still on login. Checking for errors...\n');
            const error = await page.locator('.text-red-500').textContent().catch(() => 'No error text');
            fs.appendFileSync('login_debug.log', `Error visible: ${error}\n`);

            const allText = await page.locator('body').innerText();
            fs.appendFileSync('login_debug.log', `Body text sample: ${allText.substring(0, 200).replace(/\n/g, ' ')}\n`);
        }
    } else {
        fs.appendFileSync('login_debug.log', 'Not redirected to login initially\n');
    }
});
