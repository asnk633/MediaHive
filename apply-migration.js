const Database = require('better-sqlite3');
const fs = require('fs');

// Read the migration file
const migrationSql = fs.readFileSync('./drizzle/0005_add_tenants_table.sql', 'utf8');

// Split the migration into statements (split by --> statement-breakpoint)
const statements = migrationSql.split('--> statement-breakpoint').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);

// Connect to the database
const db = new Database('dev.db');

try {
  // Execute each statement
  for (const statement of statements) {
    if (statement.trim()) {
      console.log('Executing:', statement);
      db.prepare(statement).run();
    }
  }
  console.log('Migration applied successfully!');
} catch (error) {
  console.error('Error applying migration:', error);
} finally {
  db.close();
}