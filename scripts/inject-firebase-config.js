/**
 * Inject Firebase Config
 * 
 * Reads .env variables and writes them to public/firebase-config.json.
 * This is crucial for environments where runtime ENV vars might be missing (e.g. static builds, some CI steps).
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate
const missingKeys = Object.entries(config).filter(([k, v]) => !v).map(([k]) => k);
if (missingKeys.length > 0) {
    console.warn('[INJECT-FIREBASE] Warning: Missing keys:', missingKeys.join(', '));
}

const outputPath = path.join(__dirname, '../public/firebase-config.json');
try {
    fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
    console.log(`[INJECT-FIREBASE] Successfully wrote config to ${outputPath}`);
} catch (e) {
    console.error('[INJECT-FIREBASE] Failed to write config:', e);
    process.exit(1);
}
