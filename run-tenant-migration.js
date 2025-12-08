const { Database } = require('sqlite3').verbose();
const fs = require('fs');

// Read the tenant migration SQL
const sql = fs.readFileSync('./drizzle/0005_add_tenants_table.sql', 'utf8');

// Open the database
const db = new Database('./dev.db');

// Run the SQL
db.exec(sql, (err) => {
  if (err) {
    console.error('Error running tenant migration:', err.message);
  } else {
    console.log('Tenant migration completed successfully!');
  }
});

// Close the database
db.close();