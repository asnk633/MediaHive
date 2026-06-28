const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3000/login');
    console.log('Navigated to login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('Input found successfully!');
  } catch (e) {
    console.error('Error:', e);
    await page.screenshot({ path: 'login-error.png' });
  }
  await browser.close();
})();
