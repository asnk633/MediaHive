const { chromium } = require('playwright');

async function simpleTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to root page...');
    await page.goto('http://127.0.0.1:3001/');
    console.log('Successfully navigated to root page');
    
    // Wait a bit to see the page
    await page.waitForTimeout(5000);
    
    console.log('Navigating to home page...');
    await page.goto('http://127.0.0.1:3001/home');
    console.log('Successfully navigated to home page');
    
    // Wait a bit to see the page
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

simpleTest();