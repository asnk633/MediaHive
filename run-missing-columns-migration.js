const { Database } = require('sqlite3').verbose();
const fs = require('fs');

// Read the missing columns migration SQL
const sql = fs.readFileSync('./drizzle/0006_add_missing_columns.sql', 'utf8');

// Open the database
const db = new Database('./dev.db');

// Run the SQL
db.exec(sql, (err) => {
  if (err) {
    console.error('Error running missing columns migration:', err.message);
  } else {
    console.log('Missing columns migration completed successfully!');
  }
});

// Close the database
db.close();