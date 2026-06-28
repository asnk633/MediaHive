import { chromium } from 'playwright';

async function checkConsole() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.error('BROWSER LOG [' + msg.type() + ']:', msg.text());
  });

  page.on('pageerror', err => {
    console.error('BROWSER RUNTIME EXCEPTION:', err.message, err.stack);
  });

  page.on('requestfailed', request => {
    console.error('BROWSER REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });

  try {
    console.log('Navigating to http://localhost:3001/qwen-preview.html ...');
    await page.goto('http://localhost:3001/qwen-preview.html', { waitUntil: 'load', timeout: 5000 });
    await page.waitForTimeout(3000);
    console.log('Done checking.');
  } catch (e) {
    console.error('Navigation failed:', e.message);
  } finally {
    await browser.close();
  }
}

checkConsole();
