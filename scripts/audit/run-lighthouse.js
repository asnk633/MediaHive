#!/usr/bin/env node
/**
 * Node.js wrapper for Lighthouse audit
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs-extra');
const path = require('path');

async function runLighthouse(url, outputPathHtml, outputPathJson) {
  console.log(`Running Lighthouse audit for ${url}`);
  
  let chrome;
  try {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
    });
    
    // Run Lighthouse for HTML report
    const optionsHtml = {
      logLevel: 'info',
      output: 'html',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port
    };
    
    const runnerResultHtml = await lighthouse.default(url, optionsHtml);
    
    // Save HTML report
    if (outputPathHtml) {
      fs.ensureDirSync(path.dirname(outputPathHtml));
      fs.writeFileSync(outputPathHtml, runnerResultHtml.report);
      console.log(`HTML report saved to: ${outputPathHtml}`);
    }
    
    // Run Lighthouse for JSON report
    const optionsJson = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port
    };
    
    const runnerResultJson = await lighthouse.default(url, optionsJson);
    
    // Save JSON report
    if (outputPathJson) {
      fs.ensureDirSync(path.dirname(outputPathJson));
      fs.writeJsonSync(outputPathJson, runnerResultJson.lhr, { spaces: 2 });
      console.log(`JSON report saved to: ${outputPathJson}`);
    }
    
    // Log categories
    console.log('Lighthouse results:');
    Object.keys(runnerResultJson.lhr.categories).forEach(category => {
      const score = runnerResultJson.lhr.categories[category].score * 100;
      console.log(`${category}: ${score}`);
    });
    
    return runnerResultJson.lhr;
  } catch (error) {
    console.error('Lighthouse error:', error);
    throw error;
  } finally {
    // Kill Chrome
    if (chrome) {
      await chrome.kill();
    }
  }
}

// Get arguments
const url = process.argv[2] || 'http://localhost:3000';
const outputPathHtml = process.argv[3];
const outputPathJson = process.argv[4];

runLighthouse(url, outputPathHtml, outputPathJson)
  .then(() => {
    console.log('Lighthouse audit complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('Lighthouse audit failed:', err);
    process.exit(1);
  });