/**
 * vercel-api-deploy.js
 * Uses Vercel REST API to:
 * 1. Set preview env vars (bypasses CLI non-interactive limitation)
 * 2. Trigger a production redeployment of the latest deployment
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = 'vcp_3g1s6vRlcEEhueh6SAQoBbDQk6y6CCdgBkL7sRFXC7OVKI7s8H3IP0gV';
const SCOPE = 'abdul-shukoors-projects';
const PROJECT_NAME = 'mediahive';
const KEY_FILE = path.join(__dirname, '../serviceAccountKey.json');

// HTTP helper
function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: path + (path.includes('?') ? '&' : '?') + `teamId=${SCOPE}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('Reading service account key...');
  const keyData = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));

  const vars = [
    { key: 'GOOGLE_SERVICE_ACCOUNT_EMAIL', value: keyData.client_email },
    { key: 'GOOGLE_DRIVE_FOLDER_ID', value: '1nPv67BFL0XdPw7vZ4tPBfShByCOMBfHb' },
    { key: 'GOOGLE_PRIVATE_KEY', value: keyData.private_key },
  ];

  // Step 1: Get existing env vars for the project to find IDs to update
  console.log('\n--- Fetching existing env vars from Vercel API ---');
  const existingRes = await apiRequest('GET', `/v9/projects/${PROJECT_NAME}/env`);
  if (existingRes.status !== 200) {
    console.error('Failed to fetch env vars:', existingRes.body);
    return;
  }

  const existingEnvs = existingRes.body.envs || [];
  console.log(`Found ${existingEnvs.length} existing env vars.`);

  // Build a map of key+target -> id for easy lookup
  const existingMap = {};
  for (const env of existingEnvs) {
    for (const target of (env.target || [])) {
      existingMap[`${env.key}::${target}`] = env.id;
    }
  }

  // Step 2: Set preview env vars via API
  console.log('\n--- Setting Preview environment variables ---');
  for (const { key, value } of vars) {
    const existingId = existingMap[`${key}::preview`];

    if (existingId) {
      // PATCH to update existing
      console.log(`Updating ${key} in preview (id: ${existingId})...`);
      const res = await apiRequest('PATCH', `/v9/projects/${PROJECT_NAME}/env/${existingId}`, {
        value,
        target: ['preview'],
        type: 'encrypted',
      });
      if (res.status === 200 || res.status === 201) {
        console.log(`  ✅ ${key} updated.`);
      } else {
        console.error(`  ❌ ${key} update failed:`, JSON.stringify(res.body).substring(0, 200));
      }
    } else {
      // POST to create new
      console.log(`Creating ${key} in preview...`);
      const res = await apiRequest('POST', `/v9/projects/${PROJECT_NAME}/env`, {
        key,
        value,
        target: ['preview'],
        type: 'encrypted',
      });
      if (res.status === 200 || res.status === 201) {
        console.log(`  ✅ ${key} created.`);
      } else {
        console.error(`  ❌ ${key} creation failed:`, JSON.stringify(res.body).substring(0, 200));
      }
    }
  }

  // Step 3: Get the latest production deployment and trigger a redeploy
  console.log('\n--- Triggering production redeployment ---');
  const deploymentsRes = await apiRequest('GET', `/v6/deployments?projectId=${PROJECT_NAME}&target=production&limit=1`);

  if (deploymentsRes.status !== 200 || !deploymentsRes.body.deployments?.length) {
    console.error('Failed to fetch deployments:', deploymentsRes.body);
    return;
  }

  const latestDeployment = deploymentsRes.body.deployments[0];
  console.log(`Latest deployment: ${latestDeployment.uid} (${latestDeployment.url})`);
  console.log(`State: ${latestDeployment.state}`);

  // Trigger redeploy via POST to /v13/deployments with deploymentId
  console.log('Triggering redeploy...');
  const redeployRes = await apiRequest('POST', `/v13/deployments?forceNew=1`, {
    deploymentId: latestDeployment.uid,
    name: PROJECT_NAME,
    target: 'production',
  });

  if (redeployRes.status === 200 || redeployRes.status === 201) {
    const newDeployment = redeployRes.body;
    console.log(`\n🚀 Redeployment triggered!`);
    console.log(`  Deployment ID: ${newDeployment.id || newDeployment.uid}`);
    console.log(`  URL: https://${newDeployment.url}`);
    console.log(`  State: ${newDeployment.readyState || newDeployment.status}`);
  } else {
    console.error('❌ Redeployment failed:', JSON.stringify(redeployRes.body).substring(0, 500));
  }

  console.log('\n✅ Done!');
}

run().catch(console.error);
