/**
 * API URL Validator
 * 
 * This script validates that the NEXT_PUBLIC_API_URL environment variable is set
 * and fails the build if it's missing for mobile builds.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Check if we're building for mobile
const isMobile = process.env.IS_MOBILE === 'true';

// For mobile builds, NEXT_PUBLIC_API_URL is required
if (isMobile) {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.error('[API URL VALIDATION] CRITICAL ERROR: NEXT_PUBLIC_API_URL is required for mobile builds');
    console.error('Please set NEXT_PUBLIC_API_URL in your environment variables or .env file');
    console.error('Example: NEXT_PUBLIC_API_URL=https://your-api-domain.com');
    process.exit(1);
  }
  
  // Validate that the URL is absolute
  try {
    const url = new URL(process.env.NEXT_PUBLIC_API_URL);
    if (!url.protocol.startsWith('http')) {
      console.error('[API URL VALIDATION] CRITICAL ERROR: NEXT_PUBLIC_API_URL must be an absolute HTTP/HTTPS URL');
      console.error('Current value:', process.env.NEXT_PUBLIC_API_URL);
      process.exit(1);
    }
    console.log('[API URL VALIDATION] ✓ NEXT_PUBLIC_API_URL is valid:', process.env.NEXT_PUBLIC_API_URL);
  } catch (err) {
    console.error('[API URL VALIDATION] CRITICAL ERROR: Invalid URL format for NEXT_PUBLIC_API_URL');
    console.error('Current value:', process.env.NEXT_PUBLIC_API_URL);
    console.error('Error:', err.message);
    process.exit(1);
  }
} else {
  console.log('[API URL VALIDATION] Not a mobile build, skipping API URL validation');
}