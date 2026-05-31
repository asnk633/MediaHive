const fs = require('fs');
const path = require('path');

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

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required credentials in .env.local!');
  process.exit(1);
}

async function updateConfig(key, value) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/system_config?key=eq.${key}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value, updated_at: new Date().toISOString() })
    });

    if (!res.ok) {
      console.error(`❌ Update failed for ${key}:`, await res.text());
      process.exit(1);
    }
    console.log(`✅ ${key} updated successfully to ${value}!`);
  } catch (err) {
    console.error(`❌ Update error for ${key}:`, err.message);
    process.exit(1);
  }
}

async function run() {
  await updateConfig('app_latest_version', '1.1.2-beta+2027');
  await updateConfig('app_download_url', 'https://github.com/asnk633/MediaHive/raw/main/MediaHive_V1.1.2-beta_2027.apk');
  await updateConfig('app_release_notes', 'UI Updates and curved corners for input fields across the application.');
  console.log('Update configuration process completed.');
}

run();
