const puppeteer = require('puppeteer');

async function comprehensiveValidation() {
  const browser = await puppeteer.launch({ headless: true });
  
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
    console.log(`\n=== Testing ${viewport.name} (${viewport.width}x${viewport.height}) ===`);
    
    const page = await browser.newPage();
    
    try {
      // Set viewport
      await page.setViewport({ width: viewport.width, height: viewport.height });
      
      // Set user agent if provided
      if (viewport.userAgent) {
        await page.setUserAgent(viewport.userAgent);
      }
      
      // Navigate to home page
      await page.goto('http://localhost:3000/home', { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      });
      
      console.log('Page loaded successfully');
      
      // Check for key elements
      const topBarExists = await page.$('header.topbar');
      console.log('✓ TopBar exists:', !!topBarExists);
      
      const greetingExists = await page.$('h1');
      console.log('✓ Greeting exists:', !!greetingExists);
      
      // Check for content-offset wrapper
      const contentOffsetExists = await page.$('.content-offset');
      console.log('✓ .content-offset exists:', !!contentOffsetExists);
      
      // Check main element inside content-offset
      const mainInContentOffset = await page.evaluate(() => {
        const contentOffset = document.querySelector('.content-offset');
        const main = document.querySelector('main');
        return contentOffset && main && contentOffset.contains(main);
      });
      console.log('✓ main inside .content-offset:', mainInContentOffset);
      
      // Check for FAB and BottomNav
      const fabExists = await page.$('.fab-main');
      const bottomNavExists = await page.$('.bottom-nav');
      console.log('✓ FAB exists:', !!fabExists);
      console.log('✓ BottomNav exists:', !!bottomNavExists);
      
      // Get bounding boxes if elements exist
      let topBarBox = null;
      let greetingBox = null;
      
      if (topBarExists) {
        topBarBox = await page.evaluate(() => {
          const el = document.querySelector('header.topbar');
          const rect = el.getBoundingClientRect();
          return {
            top: Math.round(rect.top * 100) / 100,
            bottom: Math.round(rect.bottom * 100) / 100,
            height: Math.round(rect.height * 100) / 100
          };
        });
        console.log('TopBar bounding box:', topBarBox);
      }
      
      if (greetingExists) {
        greetingBox = await page.evaluate(() => {
          const el = document.querySelector('h1');
          if (el) {
            const rect = el.getBoundingClientRect();
            return {
              top: Math.round(rect.top * 100) / 100,
              bottom: Math.round(rect.bottom * 100) / 100,
              height: Math.round(rect.height * 100) / 100
            };
          }
          return null;
        });
        console.log('Greeting bounding box:', greetingBox);
      }
      
      // Check for hydration errors in console
      const consoleMessages = [];
      page.on('console', msg => {
        consoleMessages.push({
          type: msg.type(),
          text: msg.text()
        });
      });
      
      // Wait a bit for any hydration errors to appear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const hydrationErrors = consoleMessages.filter(msg => 
        msg.text.includes('hydration') || 
        msg.text.includes('mismatch') || 
        msg.text.includes('Hydration') ||
        msg.type === 'error'
      );
      
      const hasHydrationErrors = hydrationErrors.length > 0;
      console.log('✓ No hydration errors:', !hasHydrationErrors);
      
      // Validate positions
      let positionValid = true;
      const issues = [];
      
      if (topBarBox) {
        if (topBarBox.top < 0) {
          positionValid = false;
          issues.push(`TopBar.top < 0 (${topBarBox.top})`);
        }
        if (topBarBox.bottom > 100) {
          // This might be acceptable depending on the design
          issues.push(`TopBar.bottom > 100 (${topBarBox.bottom})`);
        }
      }
      
      if (topBarBox && greetingBox) {
        if (greetingBox.top <= topBarBox.bottom + 4) {
          positionValid = false;
          issues.push(`Greeting not properly below TopBar (${greetingBox.top} <= ${topBarBox.bottom} + 4)`);
        }
      }
      
      // Check for negative transforms or margins
      const hasNegativeTransform = await page.evaluate(() => {
        const topBar = document.querySelector('header.topbar');
        if (topBar) {
          const style = window.getComputedStyle(topBar);
          return style.transform.includes('translateY') && style.transform.includes('-');
        }
        return false;
      });
      
      const hasNegativeMargin = await page.evaluate(() => {
        const topBar = document.querySelector('header.topbar');
        if (topBar) {
          const style = window.getComputedStyle(topBar);
          const marginTop = parseFloat(style.marginTop);
          return marginTop < 0;
        }
        return false;
      });
      
      console.log('✓ No negative translateY:', !hasNegativeTransform);
      console.log('✓ No negative marginTop:', !hasNegativeMargin);
      
      // Check content-offset padding
      const contentOffsetPadding = await page.evaluate(() => {
        const contentOffset = document.querySelector('.content-offset');
        if (contentOffset) {
          const style = window.getComputedStyle(contentOffset);
          return {
            paddingTop: style.paddingTop
          };
        }
        return null;
      });
      
      if (contentOffsetPadding) {
        console.log('✓ Content-offset padding applied:', contentOffsetPadding.paddingTop !== '0px');
      }
      
      const status = topBarExists && greetingExists && contentOffsetExists && 
                    mainInContentOffset && fabExists && bottomNavExists && 
                    !hasHydrationErrors && positionValid && 
                    !hasNegativeTransform && !hasNegativeMargin ? 'PASS' : 'FAIL';
      
      results.push({
        name: viewport.name,
        status,
        topBarExists,
        greetingExists,
        contentOffsetExists,
        mainInContentOffset,
        fabExists,
        bottomNavExists,
        hasHydrationErrors,
        positionValid,
        hasNegativeTransform,
        hasNegativeMargin,
        topBarBox,
        greetingBox,
        issues,
        contentOffsetPadding
      });
      
      console.log(`\nResult: ${status}`);
      if (issues.length > 0) {
        console.log('Issues:', issues.join(', '));
      }
      
    } catch (error) {
      console.error(`Validation failed for ${viewport.name}:`, error.message);
      results.push({ 
        name: viewport.name, 
        status: 'FAIL', 
        error: error.message 
      });
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
  
  // Print summary
  console.log('\n\n=== VALIDATION SUMMARY ===');
  results.forEach(result => {
    console.log(`${result.name}: ${result.status}`);
    if (result.issues && result.issues.length > 0) {
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    if (result.error) {
      console.log(`  - Error: ${result.error}`);
    }
  });
  
  // Count passes and failures
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  
  return results;
}

comprehensiveValidation().catch(console.error);