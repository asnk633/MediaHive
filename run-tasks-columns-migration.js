const { Database } = require('sqlite3').verbose();

// Open the database
const db = new Database('./dev.db');

// Run the SQL to add missing columns to tasks table
const sql = `
ALTER TABLE tasks ADD COLUMN reviewStatus text;
ALTER TABLE tasks ADD COLUMN last_updated_by integer REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN is_archived integer DEFAULT 0;
ALTER TABLE tasks ADD COLUMN version integer DEFAULT 1 NOT NULL;
`;

db.exec(sql, (err) => {
  if (err) {
    console.error('Error running tasks columns migration:', err.message);
  } else {
    console.log('Tasks columns migration completed successfully!');
  }
});

// Close the database
db.close();