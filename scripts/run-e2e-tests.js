#!/usr/bin/env node

/**
 * Comprehensive E2E test runner that waits for DB schema to be ready before running tests
 * Usage: node scripts/run-e2e-tests.js [--headed] [--project=chromium]
 */

const { spawn } = require('child_process');
const { waitForDB } = require('./wait-for-db.js');

async function runPlaywrightTests() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  console.log('🚀 Starting E2E test suite...');
  
  // Wait for database to be ready
  try {
    await waitForDB();
  } catch (error) {
    console.error('❌ Failed to wait for database:', error.message);
    process.exit(1);
  }
  
  // Run Playwright tests
  console.log('🧪 Running Playwright tests...');
  
  const testProcess = spawn('npx', ['playwright', 'test', ...args], {
    stdio: 'inherit',
    shell: true
  });
  
  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ All tests passed!');
    } else {
      console.log(`❌ Tests failed with exit code ${code}`);
    }
    process.exit(code);
  });
  
  testProcess.on('error', (error) => {
    console.error('❌ Failed to start Playwright tests:', error.message);
    process.exit(1);
  });
}

// Run if called directly
if (require.main === module) {
  runPlaywrightTests().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { runPlaywrightTests };