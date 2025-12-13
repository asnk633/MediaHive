const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../public/firebase-config.json');

console.log('[verify-firebase-config] Checking existence of public/firebase-config.json...');

if (!fs.existsSync(configPath)) {
    console.error('[verify-firebase-config] ERROR: public/firebase-config.json NOT FOUND.');
    console.error('[verify-firebase-config] Run "node scripts/inject-firebase-config.js" first.');
    process.exit(1);
}

try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);

    const requiredKeys = [
        'apiKey',
        'authDomain',
        'projectId'
    ];

    const missing = requiredKeys.filter(k => !config[k]);

    if (missing.length > 0) {
        console.error(`[verify-firebase-config] ERROR: Missing required keys in JSON: ${missing.join(', ')}`);
        process.exit(1);
    }

    console.log('[verify-firebase-config] SUCCESS: Config file exists and has base keys.');
    process.exit(0);
} catch (e) {
    console.error('[verify-firebase-config] ERROR: Failed to parse JSON:', e.message);
    process.exit(1);
}
