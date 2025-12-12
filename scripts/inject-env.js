const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../public/firebase-config.json');

// Only pick variables strictly needed for Client SDK to avoid leaking secrets
const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    buildTime: new Date().toISOString(),
};

// Validation
const missingKeys = Object.entries(clientConfig)
    .filter(([key, val]) => !val && key !== 'buildTime')
    .map(([key]) => key);

if (missingKeys.length > 0) {
    console.warn(`[inject-env] WARNING: Missing NEXT_PUBLIC_FIREBASE_* environment variables: ${missingKeys.join(', ')}`);
    console.warn(`[inject-env] The generated firebase-config.json will be incomplete.`);
    // We do NOT exit(1) here because sometimes dev might just rely on process.env fallback in dev mode.
    // But for production builds, this is critical.
    if (process.env.CI) {
        console.error('[inject-env] CI detected. Failing build due to missing keys.');
        process.exit(1);
    }
}

// Ensure public dir exists
const publicDir = path.dirname(configPath);
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(configPath, JSON.stringify(clientConfig, null, 2));
console.log(`[inject-env] Wrote Firebase client config to ${configPath}`);
