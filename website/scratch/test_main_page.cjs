const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[CONSOLE ERROR]:', msg.text());
    } else {
      console.log('[CONSOLE]:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error('[EXCEPTION]:', err.message);
  });

  console.log('Navigating to http://localhost:3001/index.html...');
  await page.goto('http://localhost:3001/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000); // wait for model load and calibration to execute

  await page.screenshot({ path: path.join(__dirname, 'main_page_loaded.png') });
  console.log('Captured main_page_loaded.png');

  await browser.close();
}

run().catch(console.error);
