const puppeteer = require('puppeteer');

async function simpleValidation() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing localhost:3000/home...');
  
  try {
    // Set a standard desktop viewport
    await page.setViewport({ width: 1366, height: 768 });
    
    // Navigate to home page
    await page.goto('http://localhost:3000/home', { 
      waitUntil: 'networkidle0', 
      timeout: 15000 
    });
    
    console.log('Page loaded successfully');
    
    // Check for key elements
    const topBarExists = await page.$('header.topbar');
    console.log('TopBar exists:', !!topBarExists);
    
    // Try different selectors for the greeting
    const greetingSelectors = [
      'h1:text("Good Morning")',
      'h1:has-text("Good Morning")',
      'h1',
      '.space-y-1 h1', // Based on the HomePageView structure
      'text/Good Morning'
    ];
    
    let greetingExists = false;
    let foundSelector = '';
    
    for (const selector of greetingSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          greetingExists = true;
          foundSelector = selector;
          console.log(`Greeting found with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    console.log('Greeting exists:', greetingExists);
    
    // Check for content-offset wrapper
    const contentOffsetExists = await page.$('.content-offset');
    console.log('.content-offset exists:', !!contentOffsetExists);
    
    // Check main element inside content-offset
    const mainInContentOffset = await page.evaluate(() => {
      const contentOffset = document.querySelector('.content-offset');
      const main = document.querySelector('main');
      return contentOffset && main && contentOffset.contains(main);
    });
    console.log('main inside .content-offset:', mainInContentOffset);
    
    // Get bounding boxes if elements exist
    if (topBarExists) {
      const topBarBox = await page.evaluate(() => {
        const el = document.querySelector('header.topbar');
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height
        };
      });
      console.log('TopBar bounding box:', topBarBox);
    }
    
    if (greetingExists) {
      const greetingBox = await page.evaluate(() => {
        // Use the selector that worked
        const el = document.querySelector('h1'); // Simplified
        if (el) {
          const rect = el.getBoundingClientRect();
          return {
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const hydrationErrors = consoleMessages.filter(msg => 
      msg.text.includes('hydration') || 
      msg.text.includes('mismatch') || 
      msg.text.includes('Hydration') ||
      msg.type === 'error'
    );
    
    console.log('Console messages count:', consoleMessages.length);
    if (hydrationErrors.length > 0) {
      console.log('Potential hydration errors:');
      hydrationErrors.forEach(err => console.log('  -', err.text));
    } else {
      console.log('No obvious hydration errors detected');
    }
    
    // Check the HTML structure
    const htmlStructure = await page.evaluate(() => {
      const shellWrapper = document.querySelector('.shell-wrapper');
      const contentOffset = document.querySelector('.content-offset');
      const main = document.querySelector('main');
      const topBar = document.querySelector('header.topbar');
      
      return {
        shellWrapper: !!shellWrapper,
        contentOffset: !!contentOffset,
        main: !!main,
        topBar: !!topBar,
        contentOffsetInShell: shellWrapper && contentOffset && shellWrapper.contains(contentOffset),
        mainInContentOffset: contentOffset && main && contentOffset.contains(main)
      };
    });
    
    console.log('HTML structure check:', htmlStructure);
    
    // Validate positions
    console.log('\n=== POSITION VALIDATION ===');
    if (topBarExists) {
      const topBarBox = await page.evaluate(() => {
        const el = document.querySelector('header.topbar');
        const rect = el.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height };
      });
      
      console.log(`TopBar.top >= 0: ${topBarBox.top >= 0} (${topBarBox.top})`);
      console.log(`TopBar.bottom <= 100: ${topBarBox.bottom <= 100} (${topBarBox.bottom})`);
    }
    
    if (topBarExists && greetingExists) {
      const topBarBox = await page.evaluate(() => {
        const el = document.querySelector('header.topbar');
        return el.getBoundingClientRect();
      });
      
      const greetingBox = await page.evaluate(() => {
        const el = document.querySelector('h1');
        return el ? el.getBoundingClientRect() : null;
      });
      
      if (greetingBox) {
        const greetingBelowTopBar = greetingBox.top > topBarBox.bottom + 4;
        console.log(`Greeting.top > TopBar.bottom + 4px: ${greetingBelowTopBar} (${greetingBox.top} > ${topBarBox.bottom} + 4)`);
      }
    }
    
  } catch (error) {
    console.error('Validation failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await browser.close();
  }
}

simpleValidation().catch(console.error);