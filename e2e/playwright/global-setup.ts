import { chromium, FullConfig } from '@playwright/test';
import { checkEnv } from '../../scripts/check-e2e-env';
import { loginWithCredentials } from './helpers/auth';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🏁 Starting E2E Global Setup...');
  
  // 1. Validate environment variables
  // In CI we might be running mocked UI tests without real Firebase credentials
  if (process.env.MOCK_FIREBASE !== 'true') {
    try {
      checkEnv();
    } catch (error: any) {
      console.error('❌ E2E Preflight Check Failed:', error.message);
      process.exit(1);
    }
  }

  // 2. Set unique run ID
  if (!process.env.E2E_RUN_ID) {
    const randomHex = Math.random().toString(36).substring(2, 8);
    process.env.E2E_RUN_ID = `${Date.now()}-${randomHex}`;
    console.log(`🆔 E2E_RUN_ID set to: ${process.env.E2E_RUN_ID}`);
  }

  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

  // 3. Fail fast if the web app is down
  try {
    console.log(`🌐 Checking if application is reachable at ${baseURL}...`);
    const res = await fetch(baseURL, { method: 'GET' });
    if (!res.ok && res.status >= 500) {
      throw new Error(`Server returned status ${res.status}`);
    }
    console.log('✅ Web application is reachable.');
  } catch (e: any) {
    console.error(`❌ Web application at ${baseURL} is unreachable: ${e.message || e}`);
    console.error('Please verify the app is running before executing E2E tests.');
    process.exit(1);
  }

  // 4. Create auth folder if it doesn't exist
  const authDir = path.join(process.cwd(), 'e2e', '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 5. Warm login states for admin, guest, and member
  console.log('🔐 Warming auth storage states (Admin, Guest, Member)...');
  const browser = await chromium.launch();
  
  try {
    // Admin
    console.log('  Logging in as ADMIN...');
    const adminPage = await browser.newPage();
    await loginWithCredentials(adminPage, 'admin');
    await adminPage.context().storageState({ path: path.join(authDir, 'admin-state.json') });
    await adminPage.close();
    console.log('  Saved ADMIN state.');

    // Guest
    console.log('  Logging in as GUEST...');
    const guestPage = await browser.newPage();
    await loginWithCredentials(guestPage, 'guest');
    await guestPage.context().storageState({ path: path.join(authDir, 'guest-state.json') });
    await guestPage.close();
    console.log('  Saved GUEST state.');

    // Member
    console.log('  Logging in as MEMBER...');
    const memberPage = await browser.newPage();
    await loginWithCredentials(memberPage, 'member');
    await memberPage.context().storageState({ path: path.join(authDir, 'member-state.json') });
    await memberPage.close();
    console.log('  Saved MEMBER state.');
    
    console.log('✅ Auth warming complete.');
  } catch (error) {
    console.error('❌ Failed to warm session states:', error);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  console.log('🏁 E2E Global Setup Complete.');
}

export default globalSetup;
