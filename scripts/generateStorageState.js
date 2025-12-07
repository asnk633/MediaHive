// scripts/generateStorageState.js
// Usage:
// DEBUG_HEADLESS=false BASE_URL='http://127.0.0.1:3000' E2E_TEST_EMAIL='smoke@test.local' E2E_TEST_PW='Pass123' node scripts/generateStorageState.js

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const email = process.env.E2E_TEST_EMAIL || 'smoke@test.local';
const pw = process.env.E2E_TEST_PW || 'Pass123';
const outDir = path.join(__dirname, '..', 'e2e');
const out = path.join(outDir, 'storageState.json');

const DEBUG_HEADLESS = process.env.DEBUG_HEADLESS !== 'false' ? (process.env.DEBUG_HEADLESS === 'true' ? true : false) : false;
// If you want headed: DEBUG_HEADLESS=false

const WAIT_TIMEOUT = parseInt(process.env.WAIT_TIMEOUT || '60000', 10); // 60s default

function safeWrite(name, data) {
    try {
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, name), data);
    } catch (e) {
        console.error('Could not write debug file', name, e);
    }
}

(async () => {
    console.log('Generating storage state for', email, '->', out);
    const browser = await chromium.launch({ headless: DEBUG_HEADLESS !== false }); // default headless=true; set DEBUG_HEADLESS=false to see browser
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // go to login and wait for network idle
        console.log('Navigating to', baseUrl + '/login');
        await page.goto(baseUrl + '/login', { waitUntil: 'networkidle', timeout: WAIT_TIMEOUT });

        // if the app immediately redirects to /home (already logged in), handle that
        const current = page.url();
        console.log('Current page after goto:', current);
        if (!/\/login\b/.test(current)) {
            console.log('Not on /login after navigation — maybe already logged in. Proceeding to save storage state.');
            await context.storageState({ path: out });
            console.log('Saved storage state to', out);
            await browser.close();
            process.exit(0);
        }

        // Wait for one of common email input selectors
        const selectors = [
            'input[name="email"]',
            'input[id="email"]',
            'input[type="email"]',
            'input[placeholder*="email"]',
            'input[placeholder*="Email"]',
            'input[aria-label*="email"]',
            'input[role="textbox"]',
            'input'
        ];

        let foundSelector = null;
        for (const sel of selectors) {
            try {
                console.log('Checking selector:', sel);
                await page.waitForSelector(sel, { timeout: 4000 });
                foundSelector = sel;
                console.log('Found selector:', sel);
                break;
            } catch (err) {
                // not found, continue
            }
        }

        if (!foundSelector) {
            const html = await page.content();
            safeWrite('generateStorageState.page.html', html);
            await page.screenshot({ path: path.join(outDir, 'generateStorageState.screenshot.png'), fullPage: true }).catch(() => { });
            console.error('Could not locate an email input — saved DOM and screenshot to e2e/. Please inspect them.');
            await browser.close();
            process.exit(2);
        }

        // fill discovered email + password
        await page.fill(foundSelector, email);

        // find password input (common selectors)
        const passSelectors = [
            'input[name="password"]',
            'input[id="password"]',
            'input[type="password"]',
            'input[placeholder*="password"]',
            'input[aria-label*="password"]',
        ];

        let passSel = null;
        for (const s of passSelectors) {
            try {
                await page.waitForSelector(s, { timeout: 2000 });
                passSel = s;
                break;
            } catch { }
        }
        if (!passSel) {
            // guess near the email input: find the next input
            passSel = (await page.locator(foundSelector).evaluateHandle((el) => {
                // returns the next input element's attribute path (best-effort)
                const next = el.closest('form')?.querySelectorAll('input');
                return next && next.length > 1 ? null : null;
            })).asElement ? null : null;
        }

        if (passSel) {
            await page.fill(passSel, pw);
        } else {
            // try typing into any password-looking input
            const allInputs = await page.$$('input');
            let ok = false;
            for (const i of allInputs) {
                const type = await i.getAttribute('type');
                if (type === 'password') {
                    await i.fill(pw);
                    ok = true;
                    break;
                }
            }
            if (!ok) {
                console.warn('No password input found; proceeding to press Enter to submit (if form auto-focus).');
            }
        }

        // Try to click submit button (common options)
        const btnSelectors = [
            'button[type="submit"]',
            'button:has-text("Log in")',
            'button:has-text("Login")',
            'button:has-text("Sign in")',
            'button:has-text("Sign In")',
            'input[type="submit"]'
        ];
        let clicked = false;
        for (const b of btnSelectors) {
            try {
                const el = await page.$(b);
                if (el) {
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => { }),
                        el.click().catch(() => { })
                    ]);
                    clicked = true;
                    break;
                }
            } catch (err) { }
        }
        if (!clicked) {
            // fallback: press Enter in email field
            console.log('No submit button clicked; pressing Enter in email input');
            await page.press(foundSelector, 'Enter').catch(() => { });
            await page.waitForLoadState('networkidle').catch(() => { });
        }

        // final check: are we on a logged in page?
        const finalUrl = page.url();
        console.log('After submit, url:', finalUrl);

        // wait a short bit for any client navigation
        await page.waitForTimeout(1000);

        // save storage state
        await context.storageState({ path: out });
        console.log('Saved storage state to', out);

        await browser.close();
        process.exit(0);
    } catch (err) {
        console.error('Auth generation failed:', err);
        // save debug artifacts
        try {
            const html = await page.content().catch(() => null);
            if (html) safeWrite('generateStorageState.page.html', html);
            await page.screenshot({ path: path.join(outDir, 'generateStorageState.screenshot.png'), fullPage: true }).catch(() => { });
            console.log('Wrote e2e/generateStorageState.page.html and screenshot for inspection.');
        } catch (e) {/*ignore*/ }
        await browser.close();
        process.exit(2);
    }
})();
