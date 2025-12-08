#!/usr/bin/env node

/**
 * Database Import Script
 * Imports database from SQL file or data directory
 * 
 * Usage:
 *   node scripts/backup/import-db.js --format sql --input backup.sql
 *   node scripts/backup/import-db.js --format data --input ./backup-data/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { program } = require('commander');

// Load environment variables
require('dotenv').config();

program
  .option('-f, --format <type>', 'Import format: sql or data', 'sql')
  .option('-i, --input <path>', 'Input file or directory path')
  .option('--help', 'Display help')
  .parse();

const options = program.opts();

if (options.help) {
  program.help();
}

// Validate required environment variables
const tursoUrl = process.env.TURSO_CONNECTION_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error('Error: TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN must be set in environment variables');
  process.exit(1);
}

// Validate input path
if (!options.input) {
  console.error('Error: Input path is required. Use --input to specify the file or directory to import.');
  process.exit(1);
}

if (!fs.existsSync(options.input)) {
  console.error(`Error: Input path does not exist: ${options.input}`);
  process.exit(1);
}

console.log(`Importing database from ${options.format} format from ${options.input}`);

try {
  if (options.format === 'sql') {
    // Import from SQL dump
    if (!fs.existsSync(options.input)) {
      throw new Error(`SQL file not found: ${options.input}`);
    }
    
    const cmd = `libsql-shell "${tursoUrl}" --auth-token "${tursoToken}" < "${options.input}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ Database imported from SQL successfully');
  } else if (options.format === 'data') {
    // Import from data directory
    if (!fs.existsSync(options.input) || !fs.lstatSync(options.input).isDirectory()) {
      throw new Error(`Data directory not found: ${options.input}`);
    }
    
    const dbPath = path.join(options.input, 'database.sqlite');
    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found in data directory: ${dbPath}`);
    }
    
    // For Turso/LibSQL, we need to restore differently
    // This is a simplified approach - in production, you'd need a more robust restore mechanism
    console.log('⚠️  Data directory import requires manual restoration for Turso/LibSQL');
    console.log('   Please use the Turso CLI or dashboard for full database restoration');
    console.log('   This script is primarily for local SQLite databases');
  } else {
    console.error('Error: Invalid format. Use "sql" or "data"');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Database import failed:', error.message);
  process.exit(1);
}