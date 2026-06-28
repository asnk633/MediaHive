const { chromium } = require('playwright');
const path = require('path');

async function inspect() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[BROWSER EXCEPTION]:', err.message);
  });

  console.log('Navigating to http://localhost:3001/gltf-debug.html...');
  await page.goto('http://localhost:3001/gltf-debug.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Allow model to load

  // Screenshot at rotation 0
  await page.screenshot({ path: path.join(__dirname, 'gltf_rot_0.png') });
  console.log('Captured rotation 0 (default)');

  // Sweep positive angles
  const angles = [1.0, 1.3, 1.6, 1.9, 2.2];
  for (let angle of angles) {
    await page.evaluate((val) => {
      const slider = document.getElementById('lid-rot');
      slider.value = val;
      slider.dispatchEvent(new Event('input'));
    }, angle);
    await page.waitForTimeout(500);
    const filename = `gltf_rot_${valToString(angle)}.png`;
    await page.screenshot({ path: path.join(__dirname, filename) });
    console.log(`Captured rotation ${angle} as ${filename}`);
  }

  await browser.close();
}

function valToString(v) {
  return v.toString().replace('.', '_').replace('-', 'neg_');
}

inspect().catch(console.error);
