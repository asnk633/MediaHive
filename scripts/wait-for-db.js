#!/usr/bin/env node

/**
 * Script to wait for database schema to be ready before running tests
 * Usage: node scripts/wait-for-db.js
 */

const https = require('https');
const http = require('http');

const HEALTH_URL = process.env.HEALTH_URL || 'http://localhost:3000/api/health';
const MAX_RETRIES = process.env.MAX_RETRIES || 30;
const RETRY_INTERVAL = process.env.RETRY_INTERVAL || 2000; // ms

async function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = new URL(HEALTH_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.get(HEALTH_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status === 'healthy') {
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function waitForDB() {
  console.log(`⏳ Waiting for database schema to be ready... (checking ${HEALTH_URL})`);
  
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      const isHealthy = await checkHealth();
      if (isHealthy) {
        console.log('✅ Database schema is ready!');
        return true;
      } else {
        console.log(`⚠️  Attempt ${i}/${MAX_RETRIES}: Database not ready yet`);
      }
    } catch (error) {
      console.log(`⚠️  Attempt ${i}/${MAX_RETRIES}: Health check failed - ${error.message}`);
    }
    
    if (i < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
  
  console.error('❌ Database schema is not ready after maximum retries');
  process.exit(1);
}

// Run if called directly
if (require.main === module) {
  waitForDB().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { waitForDB };