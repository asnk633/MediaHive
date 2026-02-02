/**
 * Firebase Configuration Validator
 * 
 * This script validates that the Firebase configuration is set to the staging project
 * and fails the build if the wrong project is configured.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// Check if all required environment variables are present
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('[FIREBASE VALIDATION] CRITICAL ERROR: Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`  - ${envVar}`);
  });
  process.exit(1);
}

// Check if the project ID is the correct staging project
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const expectedProjectId = 'thaiba-media-prod';

if (projectId !== expectedProjectId) {
  console.error(`[FIREBASE VALIDATION] CRITICAL ERROR: Expected project ID '${expectedProjectId}', but got '${projectId}'`);
  console.error('[FIREBASE VALIDATION] Build failed to prevent accidental use of wrong Firebase project.');
  process.exit(1);
}

// Validate other Firebase config values are not from the old project
const firebaseConfigValues = [
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY
];

const oldProjectIdentifiers = ['media-app-93b73'];

for (const configValue of firebaseConfigValues) {
  if (configValue) {
    for (const oldId of oldProjectIdentifiers) {
      if (configValue.includes(oldId)) {
        console.error(`[FIREBASE VALIDATION] CRITICAL ERROR: Found reference to old project '${oldId}' in config: ${configValue}`);
        console.error('[FIREBASE VALIDATION] Build failed to prevent accidental use of wrong Firebase project.');
        process.exit(1);
      }
    }
  }
}

console.log(`[FIREBASE VALIDATION] SUCCESS: Firebase project ID is correctly set to '${expectedProjectId}'`);
console.log('[FIREBASE VALIDATION] All required environment variables are present and valid');
process.exit(0);