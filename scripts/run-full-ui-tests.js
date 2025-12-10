#!/usr/bin/env node
// run-full-ui-tests.js
// Lightweight wrapper for running Playwright suite and summarizing groups.
// (JS, no TypeScript annotations so node can run it directly)

// execa imported dynamically below to support ESM

const path = require('path');
const fs = require('fs');

async function run() {
  try {
    const { execa } = await import('execa');
    const configFile = path.join(__dirname, '..', 'e2e', 'playwright', 'playwright.config.ts');
    // run playwright
    const cmd = 'npx';
    const args = ['playwright', 'test', 'unified-full-suite.spec.ts', '--retries=0', '--reporter=list'];
    console.log('Running Playwright tests: ', args.join(' '));
    const child = execa(cmd, args, { stdio: 'inherit' });
    await child;
    console.log('Playwright finished successfully.');

    // Read and display summary
    const resultsFile = path.join(__dirname, '../test-results/unified-test-suite-results.json');
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      console.log('\n📋 Test Suite Summary:');

      // Count passed/failed tests for each group
      Object.keys(results).forEach(group => {
        const groupResults = results[group];
        // removed TypeScript-annotations so this runs under plain Node
        const passed = Object.values(groupResults).filter((result) => result.status === 'PASS').length;
        const failed = Object.values(groupResults).filter((result) => result.status === 'FAIL').length;
        console.log(`  ${group}: ${passed} passed, ${failed} failed`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Full UI Test Suite failed:', err.message || err);
    process.exit(1);
  }
}

run();