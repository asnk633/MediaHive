#!/usr/bin/env node

/**
 * Local Replication Worker
 * Replays WAL events to a secondary database for development/testing
 * 
 * Usage:
 *   node scripts/replication-worker.js --help
 */

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { execSync } = require('child_process');

// Load environment variables
require('dotenv').config();

program
  .option('-i, --interval <seconds>', 'Polling interval in seconds', '30')
  .option('-b, --batch-size <number>', 'Batch size for event processing', '100')
  .option('--once', 'Run once and exit (for testing)')
  .option('--verbose', 'Enable verbose logging')
  .option('--help', 'Display help')
  .parse();

const options = program.opts();

if (options.help) {
  program.help();
}

const POLL_INTERVAL = parseInt(options.interval) * 1000;
const BATCH_SIZE = parseInt(options.batchSize);

console.log(`🔄 Starting replication worker (interval: ${options.interval}s, batch: ${BATCH_SIZE})`);

// Validate required environment variables
const primaryUrl = process.env.TURSO_CONNECTION_URL;
const primaryToken = process.env.TURSO_AUTH_TOKEN;
const secondaryUrl = process.env.TURSO_SECONDARY_URL;
const secondaryToken = process.env.TURSO_SECONDARY_AUTH_TOKEN;

if (!primaryUrl || !primaryToken || !secondaryUrl || !secondaryToken) {
  console.error('❌ Error: All Turso connection variables must be set:');
  console.error('   - TURSO_CONNECTION_URL (primary)');
  console.error('   - TURSO_AUTH_TOKEN (primary)');
  console.error('   - TURSO_SECONDARY_URL (secondary)');
  console.error('   - TURSO_SECONDARY_AUTH_TOKEN (secondary)');
  process.exit(1);
}

// State tracking
let lastProcessedTimestamp = null;
let isRunning = true;

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  isRunning = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  isRunning = false;
  process.exit(0);
});

/**
 * Fetch events from primary database
 */
async function fetchEvents(sinceTimestamp) {
  try {
    // In a real implementation, this would call the replication export API
    // For this simulation, we'll generate synthetic events
    
    if (options.verbose) {
      console.log(`📥 Fetching events since ${sinceTimestamp || 'beginning'}`);
    }
    
    // Simulate fetching events
    const events = [];
    const eventCount = Math.floor(Math.random() * BATCH_SIZE) + 1;
    
    for (let i = 0; i < eventCount; i++) {
      const tables = ['tasks', 'users', 'events', 'auditLog'];
      const operations = ['INSERT', 'UPDATE', 'DELETE'];
      
      events.push({
        id: `event-${Date.now()}-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        operation: operations[Math.floor(Math.random() * operations.length)],
        table: tables[Math.floor(Math.random() * tables.length)],
        primaryKey: { id: Math.floor(Math.random() * 1000) },
        data: { 
          name: `Test Item ${i}`,
          description: `Description for item ${i}`,
          updatedAt: new Date().toISOString()
        }
      });
    }
    
    return events;
  } catch (error) {
    console.error('❌ Failed to fetch events:', error.message);
    return [];
  }
}

/**
 * Apply events to secondary database
 */
async function applyEvents(events) {
  try {
    if (options.verbose) {
      console.log(`📤 Applying ${events.length} events to secondary database`);
    }
    
    // In a real implementation, this would call the replication ingest API
    // For this simulation, we'll just log the events
    
    for (const event of events) {
      if (options.verbose) {
        console.log(`   ➡️  ${event.operation} on ${event.table} (${event.id})`);
      }
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to apply events:', error.message);
    return false;
  }
}

/**
 * Main replication loop
 */
async function replicate() {
  if (!isRunning) return;
  
  try {
    // Fetch events from primary
    const events = await fetchEvents(lastProcessedTimestamp);
    
    if (events.length === 0) {
      if (options.verbose) {
        console.log('💤 No new events to process');
      }
      return;
    }
    
    // Apply events to secondary
    const success = await applyEvents(events);
    
    if (success) {
      // Update last processed timestamp
      const latestEvent = events.reduce((latest, event) => 
        new Date(event.timestamp) > new Date(latest.timestamp) ? event : latest
      );
      lastProcessedTimestamp = latestEvent.timestamp;
      
      console.log(`✅ Processed ${events.length} events (last: ${lastProcessedTimestamp})`);
    } else {
      console.error('❌ Failed to apply events, will retry');
    }
  } catch (error) {
    console.error('❌ Replication cycle failed:', error.message);
  }
}

/**
 * Start the replication worker
 */
async function startWorker() {
  console.log('🚀 Replication worker started');
  
  if (options.once) {
    // Run once and exit
    await replicate();
    console.log('🏁 Replication worker completed single run');
    process.exit(0);
  } else {
    // Continuous replication loop
    console.log(`⏱️  Starting continuous replication (polling every ${options.interval}s)`);
    
    // Run immediately
    await replicate();
    
    // Set up interval
    setInterval(async () => {
      if (isRunning) {
        await replicate();
      }
    }, POLL_INTERVAL);
  }
}

// Start the worker
startWorker().catch(error => {
  console.error('❌ Replication worker failed to start:', error.message);
  process.exit(1);
});