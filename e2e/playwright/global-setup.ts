import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global E2E Setup
 *
 * Instead of doing a real Supabase form-login (which is fragile in CI because it requires
 * test users to exist in the remote Supabase Auth project), we use the same
 * `playwright_test_auth` localStorage bypass that is built into AuthContextProvider.tsx.
 *
 * When `localStorage.playwright_test_auth === 'true'` and NODE_ENV !== 'production',
 * the AuthProvider short-circuits to a mock user instead of hitting Supabase.
 * This makes E2E auth setup instant, deterministic, and credential-free.
 *
 * Auth state files are saved to e2e/.auth/ and can be loaded by any test via
 * `use: { storageState: 'e2e/.auth/admin-state.json' }`.
 */
async function globalSetup(config: FullConfig) {
  console.log('🏁 Starting E2E Global Setup...');

  // 1. Set unique run ID
  if (!process.env.E2E_RUN_ID) {
    const randomHex = Math.random().toString(36).substring(2, 8);
    process.env.E2E_RUN_ID = `${Date.now()}-${randomHex}`;
    console.log(`🆔 E2E_RUN_ID set to: ${process.env.E2E_RUN_ID}`);
  }

  const baseURL = process.env.E2E_BASE_URL || config.projects[0]?.use?.baseURL || 'http://localhost:3000';

  // 2. Fail fast if the web app is down
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

  // 3. Create auth folder
  const authDir = path.join(process.cwd(), 'e2e', '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 4. Build storage state files using the localStorage bypass (no real credentials needed)
  const roles: Array<{ role: 'admin' | 'member'; institutionId: string; file: string; label: string }> = [
    { role: 'admin', institutionId: '1', file: 'admin-state.json', label: 'ADMIN' },
    { role: 'member', institutionId: '1', file: 'guest-state.json', label: 'GUEST' },
    { role: 'member', institutionId: '1', file: 'member-state.json', label: 'MEMBER' },
  ];

  console.log('🔐 Building mock auth storage states (no real credentials required)...');
  const browser = await chromium.launch();

  try {
    for (const { role, institutionId, file, label } of roles) {
      console.log(`  Building state for ${label}...`);
      const context = await browser.newContext();
      const page = await context.newPage();

      // Navigate to the app so localStorage is scoped to the correct origin
      await page.goto(`${baseURL}/login`);

      // Inject the mock auth bypass flags
      await page.evaluate(
        ({ role, institutionId }) => {
          localStorage.clear();
          localStorage.setItem('playwright_test_auth', 'true');
          localStorage.setItem('playwright_test_role', role);
          localStorage.setItem('playwright_test_institution_id', institutionId);
          localStorage.setItem('mediahive_onboarding_complete', 'true');
          localStorage.setItem('hasSeenMemberWelcome-v1', 'true');
        },
        { role, institutionId }
      );

      // Save the storage state (includes all the localStorage keys we just set)
      const statePath = path.join(authDir, file);
      await context.storageState({ path: statePath });
      await page.close();
      await context.close();
      console.log(`  ✅ Saved ${label} state → e2e/.auth/${file}`);
    }

    console.log('✅ Auth setup complete (localStorage bypass mode).');
  } catch (error) {
    console.error('❌ Failed to build auth storage states:', error);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  console.log('🏁 E2E Global Setup Complete.');
}

export default globalSetup;
