import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const REQUIRED = [
  'E2E_ADMIN_EMAIL', 'E2E_ADMIN_PASSWORD',
  'E2E_GUEST_EMAIL', 'E2E_GUEST_PASSWORD',
  'E2E_MEMBER_EMAIL', 'E2E_MEMBER_PASSWORD',
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'
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
