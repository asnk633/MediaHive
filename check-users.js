const { Database } = require('sqlite3').verbose();

// Open the database
const db = new Database('./dev.db');

// Query users
db.serialize(() => {
  db.each(`SELECT id, full_name, email, role FROM users`, (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(row);
  });
});

// Close the database
db.close();