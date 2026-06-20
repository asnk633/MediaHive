import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Only the app-level Supabase URL is required for E2E.
// Credentials (E2E_ADMIN_EMAIL etc.) are no longer required because
// global-setup uses the playwright_test_auth localStorage bypass instead
// of real form logins.
const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
];

export function checkEnv() {
  const missing: string[] = [];
  for (const key of REQUIRED) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required E2E environment variables: ${missing.join(', ')}. Please configure them in .env.local.`);
  }
}

// If run directly
if (require.main === module) {
  try {
    checkEnv();
    console.log('✅ All required E2E environment variables are set.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ E2E Preflight Check Failed:');
    console.error(error.message);
    process.exit(1);
  }
}
