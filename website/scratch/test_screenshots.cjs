const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to a nice size
  await page.setViewportSize({ width: 1280, height: 720 });

  page.on('console', msg => {
    console.log(`[CONSOLE]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[EXCEPTION]:', err.message);
  });

  console.log('Navigating to http://localhost:3001/qwen-preview.html...');
  await page.goto('http://localhost:3001/qwen-preview.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // Allow model loading

  // Take screenshot at scroll top
  await page.screenshot({ path: path.join(__dirname, 'qwen_scroll_0.png') });
  console.log('Captured scroll 0%');

  // Let's get the page height properties to verify scroll calculation
  const dimensions = await page.evaluate(() => {
    return {
      scrollHeight: document.body.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      windowHeight: window.innerHeight
    };
  });
  console.log('Dimensions:', dimensions);

  // Scroll to 25% of the scrollable distance
  const scroll25 = (dimensions.scrollHeight - dimensions.clientHeight) * 0.25;
  await page.evaluate((scrollPos) => {
    window.scrollTo(0, scrollPos);
  }, scroll25);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(__dirname, 'qwen_scroll_25.png') });
  console.log(`Captured scroll 25% (Y=${scroll25})`);

  // Scroll to 60% of the scrollable distance
  const scroll60 = (dimensions.scrollHeight - dimensions.clientHeight) * 0.60;
  await page.evaluate((scrollPos) => {
    window.scrollTo(0, scrollPos);
  }, scroll60);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(__dirname, 'qwen_scroll_60.png') });
  console.log(`Captured scroll 60% (Y=${scroll60})`);

  // Scroll to 100% (absolute bottom)
  const scroll100 = (dimensions.scrollHeight - dimensions.clientHeight);
  await page.evaluate((scrollPos) => {
    window.scrollTo(0, scrollPos);
  }, scroll100);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(__dirname, 'qwen_scroll_100.png') });
  console.log(`Captured scroll 100% (Y=${scroll100})`);

  await browser.close();
}

run().catch(console.error);
