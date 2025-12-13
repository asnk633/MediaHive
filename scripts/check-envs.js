const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
require('dotenv').config({ path: '.env.simple' });

const requiredPrefix = 'NEXT_PUBLIC_FIREBASE_';
const requiredKeys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
];

console.log('[ci/check-envs] Verifying environment variables...');

// Check for missing required keys
const missing = requiredKeys.filter(k => !process.env[k]);

if (missing.length > 0) {
    console.error(`[ci/check-envs] CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
    
    // Show what keys we do have for debugging
    const presentKeys = requiredKeys.filter(k => process.env[k]);
    if (presentKeys.length > 0) {
        console.log(`[ci/check-envs] Present keys: ${presentKeys.join(', ')}`);
    }
    
    process.exit(1);
}

// Additional validation - check for empty values
const emptyValues = requiredKeys.filter(k => process.env[k] === '');
if (emptyValues.length > 0) {
    console.warn(`[ci/check-envs] WARNING: The following environment variables are set but empty: ${emptyValues.join(', ')}`);
}

// Log config preview (without sensitive values)
console.log('[ci/check-envs] Firebase configuration preview:', {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 
        `${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 5)}...` : 'MISSING',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING',
    storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID
});

console.log('[ci/check-envs] All required Firebase environment variables are present.');