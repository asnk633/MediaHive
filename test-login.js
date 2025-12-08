const { chromium } = require('playwright');

async function testLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login via API
    const loginResp = await page.request.post('http://127.0.0.1:3001/api/auth/login', {
      data: { email: 'admin@thaiba.com', password: 'ChangeMe123!' },
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Login status:', loginResp.status());
    
    if (!loginResp.ok()) {
      console.error('Login failed');
      return;
    }
    
    const user = await loginResp.json();
    console.log('Logged in user:', user);
    
    // Set localStorage for client-side compatibility
    await page.addInitScript((userObj) => {
      window.localStorage.setItem('user', JSON.stringify(userObj));
    }, user);
    
    // Navigate to home page
    console.log('Navigating to /home...');
    await page.goto('http://127.0.0.1:3001/home');
    console.log('Successfully navigated to /home');
    
    // Wait a bit to see the page
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testLogin();