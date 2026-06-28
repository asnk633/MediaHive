const { chromium } = require('playwright');

async function inspect() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[BROWSER EXCEPTION]:', err.message);
  });

  console.log('Opening page...');
  await page.goto('http://localhost:3001/qwen-preview.html', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Inspect at scroll 0
  let canvasDim = await page.evaluate(() => {
    const canvas = document.getElementById('three-canvas');
    const hero = document.querySelector('.hero-section');
    return {
      canvas: { width: canvas.width, height: canvas.height, styleWidth: canvas.style.width, styleHeight: canvas.style.height, offsetWidth: canvas.offsetWidth, offsetHeight: canvas.offsetHeight },
      hero: { offsetWidth: hero.offsetWidth, offsetHeight: hero.offsetHeight, position: window.getComputedStyle(hero).position }
    };
  });
  console.log('Scroll 0% Dimensions:', JSON.stringify(canvasDim, null, 2));

  // Scroll down a bit
  console.log('Scrolling to 75vh...');
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.75));
  await page.waitForTimeout(1000);

  canvasDim = await page.evaluate(() => {
    const canvas = document.getElementById('three-canvas');
    const hero = document.querySelector('.hero-section');
    const pinSpacer = hero.parentElement;
    return {
      canvas: { offsetWidth: canvas.offsetWidth, offsetHeight: canvas.offsetHeight },
      hero: { offsetWidth: hero.offsetWidth, offsetHeight: hero.offsetHeight, position: window.getComputedStyle(hero).position, top: window.getComputedStyle(hero).top },
      pinSpacer: pinSpacer ? { className: pinSpacer.className, styleHeight: pinSpacer.style.height } : null
    };
  });
  console.log('Scroll 25% Dimensions:', JSON.stringify(canvasDim, null, 2));

  await browser.close();
}

inspect().catch(console.error);
