const Database = require('better-sqlite3');

// Connect to the database
const db = new Database('dev.db');

try {
  console.log("Applying user junction tables migration...");
  
  // Apply the migration statements
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_departments (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      department_id integer NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      created_at text NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS user_institutions (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      institution_id integer NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
      created_at text NOT NULL
    );
  `);
  
  console.log("User junction tables created successfully!");
} catch (err) {
  console.error("Migration failed:", err.message);
}