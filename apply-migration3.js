const Database = require('better-sqlite3');
const fs = require('fs');

// Read the migration file
const migrationSql = fs.readFileSync('./drizzle/0007_add_events_updated_at.sql', 'utf8');

// Connect to the database
const db = new Database('dev.db');

try {
  console.log('Executing:', migrationSql);
  db.prepare(migrationSql).run();
  console.log('Migration applied successfully!');
} catch (error) {
  console.error('Error applying migration:', error);
} finally {
  db.close();
}