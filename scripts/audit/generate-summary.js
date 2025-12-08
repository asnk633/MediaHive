#!/usr/bin/env node
/**
 * Generate a summary markdown report from audit artifacts
 */

const fs = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');

const reportDir = process.argv[2] || path.join(process.cwd(), 'reports', 'performance', 'latest');

if (!fs.existsSync(reportDir)) {
  console.error('Report directory not found:', reportDir);
  process.exit(1);
}

console.log('Generating summary report from:', reportDir);

// Read available artifacts
const artifacts = {};
const files = fs.readdirSync(reportDir);

// Check for Lighthouse reports
if (files.includes('lighthouse.json')) {
  try {
    const lighthouseData = fs.readJsonSync(path.join(reportDir, 'lighthouse.json'));
    artifacts.lighthouse = {
      categories: lighthouseData.categories,
      fetchTime: lighthouseData.fetchTime,
      finalUrl: lighthouseData.finalUrl
    };
  } catch (e) {
    console.warn('Failed to read lighthouse.json:', e.message);
  }
}

// Check for Autocannon results
if (files.includes('autocannon.json')) {
  try {
    const autocannonData = fs.readJsonSync(path.join(reportDir, 'autocannon.json'));
    artifacts.autocannon = autocannonData;
  } catch (e) {
    console.warn('Failed to read autocannon.json:', e.message);
  }
}

// Check for Playwright results
const playwrightDir = path.join(reportDir, 'playwright-test-results');
if (fs.existsSync(playwrightDir)) {
  try {
    const playwrightFiles = fs.readdirSync(playwrightDir);
    artifacts.playwright = {
      testResults: playwrightFiles.filter(f => f.endsWith('.json')).length,
      htmlReports: playwrightFiles.filter(f => f.endsWith('.html')).length
    };
  } catch (e) {
    console.warn('Failed to read playwright results:', e.message);
  }
}

// Generate markdown summary
const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
let summary = `# Performance Audit Report\n\n`;
summary += `**Generated:** ${timestamp}\n\n`;

// Lighthouse section
if (artifacts.lighthouse) {
  summary += `## Lighthouse Results\n\n`;
  summary += `**URL:** ${artifacts.lighthouse.finalUrl}\n\n`;
  summary += `**Audit Time:** ${artifacts.lighthouse.fetchTime}\n\n`;
  
  summary += `| Category | Score |\n`;
  summary += `|----------|-------|\n`;
  
  for (const [key, category] of Object.entries(artifacts.lighthouse.categories)) {
    const score = Math.round(category.score * 100);
    summary += `| ${category.title} | ${score}/100 |\n`;
  }
  
  summary += `\n`;
}

// Autocannon section
if (artifacts.autocannon) {
  summary += `## Load Test Results (Autocannon)\n\n`;
  summary += `**Target URL:** ${artifacts.autocannon.url}\n\n`;
  summary += `**Duration:** ${artifacts.autocannon.duration}s\n\n`;
  summary += `**Connections:** ${artifacts.autocannon.connections}\n\n`;
  
  summary += `| Metric | Value |\n`;
  summary += `|--------|-------|\n`;
  summary += `| Requests/sec | ${artifacts.autocannon.requests.average.toFixed(2)} |\n`;
  summary += `| Latency (ms) | ${artifacts.autocannon.latency.average.toFixed(2)} |\n`;
  summary += `| Throughput (bytes/sec) | ${artifacts.autocannon.throughput.average.toFixed(2)} |\n`;
  
  if (artifacts.autocannon.errors) {
    summary += `| Errors | ${artifacts.autocannon.errors} |\n`;
  }
  
  summary += `\n`;
}

// Playwright section
if (artifacts.playwright) {
  summary += `## Playwright Test Results\n\n`;
  summary += `**Test Result Files:** ${artifacts.playwright.testResults}\n\n`;
  summary += `**HTML Reports:** ${artifacts.playwright.htmlReports}\n\n`;
}

// Recommendations section
summary += `## Recommendations\n\n`;
summary += `- Review Lighthouse scores and address issues in categories below 90\n`;
summary += `- Optimize API endpoints with high latency or low throughput\n`;
summary += `- Check for memory leaks in long-running tests\n`;
summary += `- Consider implementing caching for frequently accessed resources\n`;
summary += `- Review bundle sizes and optimize large JavaScript chunks\n\n`;

// Artifacts section
summary += `## Generated Artifacts\n\n`;
summary += `The following artifacts were generated during this audit:\n\n`;
files.forEach(file => {
  summary += `- ${file}\n`;
});

summary += `\n`;

// Write summary to file
const summaryPath = path.join(reportDir, 'summary.md');
fs.writeFileSync(summaryPath, summary);
console.log('Summary report saved to:', summaryPath);