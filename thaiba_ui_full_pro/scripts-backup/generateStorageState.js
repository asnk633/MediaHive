// scripts/generateStorageState.js
// Usage:
// BASE_URL=http://127.0.0.1:3000 E2E_TEST_EMAIL=smoke@test.local E2E_TEST_PW=Pass123 node scripts/generateStorageState.js

import { chromium } from 'playwright';

const email = process.env.E2E_TEST_EMAIL;
const pw = process.env.E2E_TEST_PW;
const baseFromEnv = process.env.BASE_URL || 'http://localhost:3000';
const outPath = process.env.STORAGE_PATH || 'e2e/storageState.json';
const maxAttempts = 6;

if (!email || !pw) {
    console.error('E2E_TEST_EMAIL and E2E_TEST_PW required');
    process.exit(1);
}

const hostsToTry = (function () {
    // try provided host first, then fallbacks
    const url = new URL(baseFromEnv);
    const hostCandidates = [baseFromEnv];

    // only add IPv4/IPv6 fallbacks if host is 'localhost'
    if (url.hostname === 'localhost') {
        // prefer explicit IPv4 first
        hostCandidates.push(`${url.protocol}//127.0.0.1:${url.port || ''}`.replace(/:$/, ''));
        hostCandidates.push(`${url.protocol}//[::1]:${url.port || ''}`.replace(/:$/, ''));
    }
    return hostCandidates;
})();

async function tryUrl(loginUrl) {
    let attempt = 0;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        console.log(`Trying login at: ${loginUrl}`);
        while (attempt < maxAttempts) {
            try {
                // navigate and wait networkidle
                await page.goto(`${loginUrl.replace(/\/$/, '')}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
                // fill form - update selectors if different
                await page.fill('input[name="email"]', email, { timeout: 60000 });
                await page.fill('input[name="password"]', pw, { timeout: 60000 });
                // submit and wait for navigation/networkidle
                await Promise.all([
                    page.click('button[type="submit"]', { timeout: 60000 }),
                    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => null),
                ]);
                // quick check: if page URL changed or we can detect an element only present when logged in
                const urlAfter = page.url();
                console.log('After submit url:', urlAfter);
                // success heuristics: no mention of /login in url and body visible
                if (!urlAfter.includes('/login') && (await page.evaluate(() => !document.body.hidden))) {
                    console.log('Login successful, saving storageState ->', outPath);
                    await page.context().storageState({ path: outPath });
                    await browser.close();
                    return true;
                }
                // else throw to trigger retry
                throw new Error('Login did not appear to succeed (still on login or body hidden)');
            } catch (err) {
                attempt++;
                const backoff = Math.min(1000 * Math.pow(2, attempt), 10000);
                console.warn(`Attempt ${attempt} failed: ${err.message}. Backing off ${backoff}ms and retrying...`);
                await new Promise((r) => setTimeout(r, backoff));
            }
        }
        console.error(`Max attempts (${maxAttempts}) reached for ${loginUrl}`);
        await browser.close();
        return false;
    } catch (err) {
        await browser.close();
        throw err;
    }
}

(async () => {
    for (const host of hostsToTry) {
        try {
            const ok = await tryUrl(host);
            if (ok) {
                console.log('Storage state generated successfully.');
                process.exit(0);
            }
        } catch (err) {
            console.warn(`Host ${host} failed with error: ${err && err.message}`);
        }
    }
    console.error('All host attempts failed. Ensure the dev server is running and reachable at one of:', hostsToTry);
    process.exit(2);
})();
