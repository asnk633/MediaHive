const fs = require('fs');
const path = require('path');

// Read .env.local file safely
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

function parseEnv(content) {
  const result = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      
      result[key] = value;
    }
  }
  return result;
}

const envConfig = parseEnv(envContent);

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;
const project_id = envConfig.FIREBASE_ADMIN_PROJECT_ID;
const client_email = envConfig.FIREBASE_ADMIN_CLIENT_EMAIL;
let private_key = envConfig.FIREBASE_ADMIN_PRIVATE_KEY;

if (!supabaseUrl || !serviceRoleKey || !project_id || !client_email || !private_key) {
  console.error('❌ Missing required credentials in .env.local!');
  process.exit(1);
}

private_key = private_key.replace(/\\n/g, '\n');

const serviceAccount = {
  type: "service_account",
  project_id,
  private_key,
  client_email
};

const serviceAccountBase64 = Buffer.from(JSON.stringify(serviceAccount)).toString('base64');

async function seed() {
  console.log('🚀 Syncing firebase_service_account into public.system_config via REST...');
  
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/system_config`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        key: 'firebase_service_account',
        value: serviceAccountBase64,
        updated_at: new Date().toISOString()
      })
    });

    if (!res.ok) {
      console.error('❌ Seeding failed:', await res.text());
      process.exit(1);
    }

    console.log('✅ firebase_service_account synced successfully in system_config!');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seed();
