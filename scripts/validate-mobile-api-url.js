#!/usr/bin/env node

/**
 * Build-time validation for mobile builds
 * Ensures NEXT_PUBLIC_API_URL is set when IS_MOBILE=true
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const isMobile = process.env.IS_MOBILE === 'true';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

console.log('[BUILD VALIDATION] IS_MOBILE:', isMobile);
console.log('[BUILD VALIDATION] NEXT_PUBLIC_API_URL:', apiUrl || 'UNSET');

if (isMobile) {
  if (!apiUrl) {
    console.error('[BUILD VALIDATION] ❌ FATAL: NEXT_PUBLIC_API_URL is required for mobile builds');
    console.error('[BUILD VALIDATION] Please set NEXT_PUBLIC_API_URL in your environment');
    console.error('[BUILD VALIDATION] Example: NEXT_PUBLIC_API_URL=https://api.yourdomain.com');
    process.exit(1);
  }
  
  try {
    const url = new URL(apiUrl);
    if (!url.protocol.startsWith('http')) {
      console.error('[BUILD VALIDATION] ❌ FATAL: NEXT_PUBLIC_API_URL must be an absolute HTTP/HTTPS URL');
      console.error('[BUILD VALIDATION] Got:', apiUrl);
      process.exit(1);
    }
    console.log('[BUILD VALIDATION] ✅ NEXT_PUBLIC_API_URL is valid:', apiUrl);
  } catch (err) {
    console.error('[BUILD VALIDATION] ❌ FATAL: Invalid URL format for NEXT_PUBLIC_API_URL');
    console.error('[BUILD VALIDATION] Got:', apiUrl);
    console.error('[BUILD VALIDATION] Error:', err.message);
    process.exit(1);
  }
} else {
  console.log('[BUILD VALIDATION] Not a mobile build, skipping API URL validation');
}

console.log('[BUILD VALIDATION] ✅ Build validation passed');