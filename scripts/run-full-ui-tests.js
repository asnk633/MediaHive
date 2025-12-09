#!/usr/bin/env node
// run-full-ui-tests.js
// Lightweight wrapper for running Playwright suite and summarizing groups.
// (JS, no TypeScript annotations so node can run it directly)

const execa = require('execa');
const path = require('path');
const fs = require('fs');

async function run() {
  try {
    const configFile = path.join(__dirname, '..', 'e2e', 'playwright', 'playwright.config.ts');
    // run playwright
    const cmd = 'npx';
    const args = ['playwright', 'test', 'unified-full-suite.spec.ts', '--retries=0', '--reporter=list'];
    console.log('Running Playwright tests: ', args.join(' '));
    const child = execa(cmd, args, { stdio: 'inherit' });
    await child;
    console.log('Playwright finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Full UI Test Suite failed:', err.message || err);
    process.exit(1);
  }
}

run();