import { chromium } from 'playwright';

async function checkConsole() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('BROWSER ERROR:', msg.text());
    } else {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error('BROWSER RUNTIME EXCEPTION:', err.message, err.stack);
  });

  page.on('requestfailed', request => {
    console.error('BROWSER REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });

  try {
    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 5000 });
    // Wait a couple of seconds for animations & Three.js initialization
    await page.waitForTimeout(2000);
    console.log('Done checking.');
  } catch (e) {
    console.error('Navigation failed:', e.message);
  } finally {
    await browser.close();
  }
}

checkConsole();
