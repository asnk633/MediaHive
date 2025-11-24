const { Database } = require('sqlite3').verbose();
const fs = require('fs');

// Read the events updated_at migration SQL
const sql = fs.readFileSync('./drizzle/0007_add_events_updated_at.sql', 'utf8');

// Open the database
const db = new Database('./dev.db');

// Run the SQL
db.exec(sql, (err) => {
  if (err) {
    console.error('Error running events updated_at migration:', err.message);
  } else {
    console.log('Events updated_at migration completed successfully!');
  }
});

// Close the database
db.close();