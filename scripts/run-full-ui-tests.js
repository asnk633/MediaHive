#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to run a command and wait for it to complete
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`));
      }
    });
    
    proc.on('error', (error) => {
      reject(error);
    });
  });
}

// Function to ensure test-results directory exists
function ensureTestResultsDir() {
  const testResultsDir = path.join(__dirname, '../test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting Full UI Test Suite...');
    
    // Ensure test results directory exists
    ensureTestResultsDir();
    
    // Run the unified test suite
    console.log('\n🧪 Running Unified Full UI Test Suite...');
    await runCommand('npx', ['playwright', 'test', 'unified-full-suite.spec.ts', '--retries=0']);
    
    console.log('\n✅ Full UI Test Suite completed successfully!');
    
    // Check if results file was created
    const resultsFile = path.join(__dirname, '../test-results/unified-test-suite-results.json');
    if (fs.existsSync(resultsFile)) {
      console.log(`\n📊 Test results available at: ${resultsFile}`);
      
      // Read and display summary
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      console.log('\n📋 Test Suite Summary:');
      
      // Count passed/failed tests for each group
      Object.keys(results).forEach(group => {
        const groupResults = results[group];
        // Node (plain JS) cannot parse TypeScript annotations; remove them
        const passed = Object.values(groupResults).filter((result) => result.status === 'PASS').length;
        const failed = Object.values(groupResults).filter((result) => result.status === 'FAIL').length;
        console.log(`  ${group}: ${passed} passed, ${failed} failed`);
      });
    } else {
      console.log('\n⚠️  Test results file not found');
    }
    
  } catch (error) {
    console.error('\n❌ Full UI Test Suite failed:', error.message);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}