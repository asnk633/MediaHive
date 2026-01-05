// Debug script to check Firebase network connectivity issues
const fs = require('fs');
const path = require('path');

// Check if we can read the Firebase config file
console.log('Checking Firebase configuration...');

const configPath = path.join(__dirname, 'public', 'firebase-config.json');
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✓ Firebase config file found');
    console.log('  Project ID:', config.projectId);
    console.log('  API Key present:', !!config.apiKey);
  } catch (err) {
    console.error('✗ Error reading Firebase config:', err.message);
  }
} else {
  console.error('✗ Firebase config file not found at:', configPath);
}

// Check environment variables
console.log('\nChecking environment variables...');
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length === 0) {
  console.log('✓ All required Firebase environment variables are set');
} else {
  console.log('⚠ Missing environment variables:');
  missingEnvVars.forEach(envVar => console.log('  -', envVar));
}

// Test network connectivity
console.log('\nTesting network connectivity...');
const { exec } = require('child_process');

exec('ping -c 3 firebase.google.com || ping -n 3 firebase.google.com', (error, stdout, stderr) => {
  if (error) {
    console.log('⚠ Network test failed - this might explain the Firebase connection issues');
    console.log('  Error:', error.message);
  } else {
    console.log('✓ Network connectivity test passed');
    console.log('  Output:', stdout);
  }
  
  console.log('\nDebug script completed. Check the results above for potential issues.');
});