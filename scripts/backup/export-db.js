#!/usr/bin/env node

/**
 * Database Export Script
 * Exports database in SQL format or as data directory
 * 
 * Usage:
 *   node scripts/backup/export-db.js --format sql --output backup.sql
 *   node scripts/backup/export-db.js --format data --output ./backup-data/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { program } = require('commander');

// Load environment variables
require('dotenv').config();

program
  .option('-f, --format <type>', 'Export format: sql or data', 'sql')
  .option('-o, --output <path>', 'Output file or directory path')
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

// Determine output path
let outputPath = options.output;
if (!outputPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  outputPath = options.format === 'sql' 
    ? `backup-${timestamp}.sql` 
    : `backup-${timestamp}`;
}

console.log(`Exporting database in ${options.format} format to ${outputPath}`);

try {
  if (options.format === 'sql') {
    // Export as SQL dump
    const cmd = `echo ".dump" | libsql-shell "${tursoUrl}" --auth-token "${tursoToken}" > "${outputPath}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ Database exported as SQL successfully');
  } else if (options.format === 'data') {
    // Export as data directory (using SQLite backup)
    // Ensure output directory exists
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    // Create backup using SQLite backup command
    const backupPath = path.join(outputPath, 'database.sqlite');
    const cmd = `echo ".backup '${backupPath}'" | libsql-shell "${tursoUrl}" --auth-token "${tursoToken}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ Database exported as data directory successfully');
  } else {
    console.error('Error: Invalid format. Use "sql" or "data"');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Database export failed:', error.message);
  process.exit(1);
}