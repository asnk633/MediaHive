const { Database } = require('sqlite3').verbose();
const fs = require('fs');

// Read the notifications migrations SQL
const sql8 = fs.readFileSync('./drizzle/0008_fix_notifications_column.sql', 'utf8');
const sql9 = fs.readFileSync('./drizzle/0009_fix_notifications_columns.sql', 'utf8');

// Open the database
const db = new Database('./dev.db');

// Run the SQL migrations
db.exec(sql8, (err) => {
  if (err) {
    console.error('Error running notifications column rename migration:', err.message);
  } else {
    console.log('Notifications column rename migration completed successfully!');
    
    // Run the second migration
    db.exec(sql9, (err) => {
      if (err) {
        console.error('Error running notifications columns migration:', err.message);
      } else {
        console.log('Notifications columns migration completed successfully!');
      }
    });
  }
});

// Close the database
db.close();