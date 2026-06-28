const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  console.log('Navigating to http://localhost:3001/qwen-preview.html...');
  await page.goto('http://localhost:3001/qwen-preview.html', { waitUntil: 'networkidle' });

  // Take screenshot at scroll 0
  await page.screenshot({ path: path.join(__dirname, 'qwen_scroll_0.png') });
  console.log('Captured scroll 0%');

  // Scroll to 25% (clearing clutter)
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.75));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, 'qwen_scroll_25.png') });
  console.log('Captured scroll 25%');

  // Scroll to 60% (laptop opening)
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.8));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, 'qwen_scroll_60.png') });
  console.log('Captured scroll 60%');

  // Scroll to 100% (logo fully open and glowing)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, 'qwen_scroll_100.png') });
  console.log('Captured scroll 100%');

  await browser.close();
}

capture().catch(err => {
  console.error('ERROR CAPTURING SCREENSHOTS:', err);
  process.exit(1);
});
