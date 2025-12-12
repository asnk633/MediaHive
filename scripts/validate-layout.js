const puppeteer = require('puppeteer');
const fs = require('fs');

async function validateLayout() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Define viewport presets to test
  const viewports = [
    { name: 'Desktop', width: 1366, height: 768 },
    { name: 'Tablet', width: 1024, height: 768 },
    { name: 'Chrome Mobile', width: 412, height: 915 },
    { name: 'Pixel 7', width: 412, height: 915, userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36' },
    { name: 'Samsung Galaxy S21', width: 360, height: 800 }
  ];
  
  const results = [];
  
  for (const viewport of viewports) {
    console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
    
    // Set viewport
    await page.setViewport({ width: viewport.width, height: viewport.height });
    
    // Set user agent if provided
    if (viewport.userAgent) {
      await page.setUserAgent(viewport.userAgent);
    }
    
    // Navigate to home page
    try {
      await page.goto('http://localhost:3000/home', { waitUntil: 'networkidle0', timeout: 10000 });
    } catch (error) {
      console.error(`Failed to load page for ${viewport.name}:`, error.message);
      results.push({ name: viewport.name, status: 'FAIL', error: 'Page load failed' });
      continue;
    }
    
    // Check for hydration errors
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    // Wait for key elements
    try {
      await page.waitForSelector('header.topbar', { timeout: 5000 });
      await page.waitForSelector('h1:text("Good Morning")', { timeout: 5000 });
    } catch (error) {
      console.error(`Failed to find key elements for ${viewport.name}:`, error.message);
      results.push({ name: viewport.name, status: 'FAIL', error: 'Key elements not found' });
      continue;
    }
    
    // Get bounding boxes
    const topBarBox = await page.evaluate(() => {
      const el = document.querySelector('header.topbar');
      return el ? el.getBoundingClientRect() : null;
    });
    
    const greetingBox = await page.evaluate(() => {
      const el = document.querySelector('h1');
      return el ? el.getBoundingClientRect() : null;
    });
    
    const contentOffsetExists = await page.evaluate(() => {
      return document.querySelector('.content-offset') !== null;
    });
    
    const mainInContentOffset = await page.evaluate(() => {
      const contentOffset = document.querySelector('.content-offset');
      const main = document.querySelector('main');
      return contentOffset && main && contentOffset.contains(main);
    });
    
    // Validate positions
    let status = 'PASS';
    const issues = [];
    
    if (!topBarBox) {
      status = 'FAIL';
      issues.push('TopBar not found');
    } else {
      if (topBarBox.top < 0) {
        status = 'FAIL';
        issues.push(`TopBar.top < 0 (${topBarBox.top})`);
      }
      if (topBarBox.bottom > 100) {
        // This might be acceptable depending on the design
        issues.push(`TopBar.bottom > 100 (${topBarBox.bottom})`);
      }
    }
    
    if (!greetingBox || !topBarBox) {
      status = 'FAIL';
      issues.push('Greeting or TopBar not found');
    } else {
      if (greetingBox.top <= topBarBox.bottom + 4) {
        status = 'FAIL';
        issues.push(`Greeting not properly below TopBar (${greetingBox.top} <= ${topBarBox.bottom} + 4)`);
      }
    }
    
    if (!contentOffsetExists) {
      status = 'FAIL';
      issues.push('.content-offset wrapper not found');
    }
    
    if (!mainInContentOffset) {
      status = 'FAIL';
      issues.push('main not inside .content-offset');
    }
    
    // Check for hydration errors
    const hydrationErrors = consoleMessages.filter(msg => 
      msg.includes('hydration') || msg.includes('mismatch') || msg.includes('Hydration')
    );
    
    if (hydrationErrors.length > 0) {
      status = 'FAIL';
      issues.push(`Hydration errors: ${hydrationErrors.join(', ')}`);
    }
    
    results.push({
      name: viewport.name,
      status,
      topBar: topBarBox,
      greeting: greetingBox,
      contentOffsetExists,
      mainInContentOffset,
      issues,
      hydrationErrors: hydrationErrors.length
    });
    
    console.log(`${viewport.name}: ${status}`);
    if (issues.length > 0) {
      console.log(`  Issues: ${issues.join(', ')}`);
    }
  }
  
  await browser.close();
  
  // Print summary
  console.log('\n=== VALIDATION SUMMARY ===');
  results.forEach(result => {
    console.log(`${result.name}: ${result.status}`);
    if (result.issues && result.issues.length > 0) {
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  });
  
  // Save results to file
  fs.writeFileSync('layout-validation-results.json', JSON.stringify(results, null, 2));
  console.log('\nDetailed results saved to layout-validation-results.json');
  
  return results;
}

// Run validation
validateLayout().catch(console.error);