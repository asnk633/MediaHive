/**
 * Mobile Environment Setup
 * 
 * This script sets up the environment for mobile builds by ensuring all required
 * environment variables are set and valid.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

console.log('[MOBILE ENV SETUP] Setting up environment for mobile build...');

// Check if we're building for mobile
const isMobile = process.env.IS_MOBILE === 'true';

if (!isMobile) {
  console.log('[MOBILE ENV SETUP] Not a mobile build, skipping mobile environment setup');
  process.exit(0);
}

console.log('[MOBILE ENV SETUP] Mobile build detected, validating environment...');

// Required environment variables for mobile builds
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// Check for missing required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('[MOBILE ENV SETUP] CRITICAL ERROR: Missing required environment variables for mobile build:');
  missingEnvVars.forEach(envVar => {
    console.error(`  - ${envVar}`);
  });

  // Show what keys we do have for debugging
  const presentKeys = requiredEnvVars.filter(envVar => process.env[envVar]);
  if (presentKeys.length > 0) {
    console.log('[MOBILE ENV SETUP] Present keys:');
    presentKeys.forEach(envVar => {
      console.log(`  - ${envVar}: ${process.env[envVar]}`);
    });
  }

  process.exit(1);
}

// Validate NEXT_PUBLIC_API_URL
if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_API_URL);
    if (!url.protocol.startsWith('http')) {
      console.error('[MOBILE ENV SETUP] CRITICAL ERROR: NEXT_PUBLIC_API_URL must be an absolute HTTP/HTTPS URL');
      console.error('Current value:', process.env.NEXT_PUBLIC_API_URL);
      process.exit(1);
    }
    console.log('[MOBILE ENV SETUP] ✓ NEXT_PUBLIC_API_URL is valid:', process.env.NEXT_PUBLIC_API_URL);
  } catch (err) {
    console.error('[MOBILE ENV SETUP] CRITICAL ERROR: Invalid URL format for NEXT_PUBLIC_API_URL');
    console.error('Current value:', process.env.NEXT_PUBLIC_API_URL);
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Validate Firebase configuration
// Validate Firebase configuration
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const allowedProjectIds = ['thaiba-media-staging', 'thaiba-media-prod'];

if (!allowedProjectIds.includes(firebaseProjectId)) {
  console.error('[MOBILE ENV SETUP] CRITICAL ERROR: Firebase project ID is not set to an allowed project');
  console.error('Expected one of:', allowedProjectIds.join(', '));
  console.error('Current:', firebaseProjectId);
  process.exit(1);
}

console.log('[MOBILE ENV SETUP] ✓ All environment variables are valid for mobile build');
console.log('[MOBILE ENV SETUP] Mobile environment setup complete');