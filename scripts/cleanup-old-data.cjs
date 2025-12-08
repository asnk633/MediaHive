#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

// Clean up old backup files older than 7 days
const backupDir = ".";
const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;

fs.readdirSync(backupDir)
  .filter(file => file.startsWith("backup-") && file.endsWith(".sql"))
  .forEach(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    if (stats.mtime.getTime() < cutoffTime) {
      fs.unlinkSync(filePath);
      console.log(`Deleted old backup: ${file}`);
    }
  });

console.log("Housekeeping complete");