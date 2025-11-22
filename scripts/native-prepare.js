// scripts/native-prepare.js
// Script to prepare the native mobile wrapper using Capacitor

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Preparing native mobile wrapper...');

try {
  // Check if Capacitor is installed
  execSync('npx cap --version', { stdio: 'ignore' });
  console.log('✓ Capacitor CLI found');
} catch (error) {
  console.error('✗ Capacitor CLI not found. Please install it with: npm install @capacitor/cli');
  process.exit(1);
}

// Create necessary directories if they don't exist
const androidDir = path.join(__dirname, '..', 'android');
const iosDir = path.join(__dirname, '..', 'ios');

if (!fs.existsSync(androidDir)) {
  console.log('Creating Android directory...');
  fs.mkdirSync(androidDir, { recursive: true });
}

if (!fs.existsSync(iosDir)) {
  console.log('Creating iOS directory...');
  fs.mkdirSync(iosDir, { recursive: true });
}

try {
  // Add Android platform
  console.log('Adding Android platform...');
  execSync('npx cap add android', { stdio: 'inherit' });
  console.log('✓ Android platform added');
} catch (error) {
  console.warn('⚠ Warning: Failed to add Android platform:', error.message);
}

try {
  // Add iOS platform (only on macOS)
  if (process.platform === 'darwin') {
    console.log('Adding iOS platform...');
    execSync('npx cap add ios', { stdio: 'inherit' });
    console.log('✓ iOS platform added');
  } else {
    console.log('⚠ Skipping iOS platform (not on macOS)');
  }
} catch (error) {
  console.warn('⚠ Warning: Failed to add iOS platform:', error.message);
}

// Copy web assets
console.log('Copying web assets...');
execSync('npx cap copy', { stdio: 'inherit' });
console.log('✓ Web assets copied');

// Update native projects
console.log('Updating native projects...');
execSync('npx cap update', { stdio: 'inherit' });
console.log('✓ Native projects updated');

console.log('\nNative wrapper preparation completed!');
console.log('\nNext steps:');
console.log('1. For Android: Open android/ directory in Android Studio');
console.log('2. For iOS: Open ios/App/App.xcworkspace in Xcode');
console.log('3. Build and run the native app');