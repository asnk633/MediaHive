#!/usr/bin/env node

const https = require('https');
const process = require('process');

// Colors for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Parse arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

console.log(`${BOLD}${CYAN}🤖 MediaHive Self-Healing Trigger (Jules API) ${isDryRun ? '[DRY RUN MODE]' : ''}${RESET}\n`);

// 1. Fetch parameters from environment variables
const apiKey = process.env.JULES_API_KEY;
const rawRepo = process.env.GITHUB_REPOSITORY || 'asnk633/MediaHive';
const branch = process.env.GITHUB_REF_NAME || 'main';
const failureLogUrl = process.env.FAILURE_LOG_URL || '';

// Clean up repo string to ensure it's a full github URL prefix
const repository = rawRepo.startsWith('github.com/') ? rawRepo : `github.com/${rawRepo}`;

// 2. Validate essential inputs
if (!apiKey && !isDryRun) {
  console.error(`${RED}${BOLD}❌ Error: JULES_API_KEY environment variable is missing.${RESET}`);
  console.error(`   Please set JULES_API_KEY in your secrets before running this script.\n`);
  process.exit(1);
}

if (!failureLogUrl) {
  console.log(`${YELLOW}⚠️  Warning: FAILURE_LOG_URL is not set. Jules won't have the context of the build logs.${RESET}`);
}

// Mask API key for logs
const maskedKey = apiKey ? `${apiKey.slice(0, 6)}***${apiKey.slice(-4)}` : 'MISSING';

console.log(`${BOLD}Target Configuration:${RESET}`);
console.log(`- Repository: ${YELLOW}${repository}${RESET}`);
console.log(`- Branch:     ${YELLOW}${branch}${RESET}`);
console.log(`- Log URL:    ${YELLOW}${failureLogUrl || 'Not provided'}${RESET}`);
console.log(`- API Key:    ${YELLOW}${maskedKey}${RESET}\n`);

// 3. Construct prompt for Jules AI
const prompt = `Our CI build pipeline failed. 
${failureLogUrl ? `The failure logs can be found here: ${failureLogUrl}\n` : ''}
Please perform the following actions:
1. Analyze the build error from the logs/environment.
2. Fix the underlying code issues (e.g. type errors, eslint violations, syntax issues) in the codebase.
3. Validate your fix by running the local cross-platform verification script:
   "node scripts/verify_cross_platform_builds.js"
4. Ensure all steps in the verification script (Web linter, Flutter analysis) pass cleanly.
5. Commit and push the fix to the branch.`;

// 4. Construct JSON Payload
const payload = JSON.stringify({
  source: {
    repository: repository,
    branch: branch
  },
  prompt: prompt
});

// 5. Execute Action
if (isDryRun) {
  console.log(`${GREEN}${BOLD}✔ Dry run successful. Target JSON Payload:${RESET}`);
  console.log(JSON.stringify(JSON.parse(payload), null, 2));
  console.log(`\nEndpoint: ${CYAN}POST https://jules.googleapis.com/v1alpha/sessions${RESET}`);
  console.log(`Headers:`);
  console.log(`  Content-Type: application/json`);
  console.log(`  x-goog-api-key: ${maskedKey}\n`);
  process.exit(0);
}

console.log(`${BOLD}Sending trigger request to Google Jules API...${RESET}`);

const options = {
  hostname: 'jules.googleapis.com',
  port: 443,
  path: '/v1alpha/sessions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`\n${GREEN}${BOLD}🎉 Success! Jules session triggered successfully (HTTP ${res.statusCode}).${RESET}`);
      try {
        const responseJson = JSON.parse(body);
        console.log(`Session ID: ${YELLOW}${responseJson.name || 'Unknown ID'}${RESET}\n`);
      } catch {
        console.log(`Raw Response: ${body}\n`);
      }
      process.exit(0);
    } else {
      console.error(`\n${RED}${BOLD}❌ API Request Failed (HTTP ${res.statusCode})${RESET}`);
      console.error(`Response: ${body}\n`);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n${RED}${BOLD}❌ Connection Error: ${e.message}${RESET}\n`);
  process.exit(1);
});

// Write data and terminate request
req.write(payload);
req.end();
