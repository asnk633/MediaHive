const { Database } = require('sqlite3').verbose();

// Open the database
const db = new Database('./dev.db');

// Query tables
db.serialize(() => {
  db.each(`SELECT name FROM sqlite_master WHERE type='table'`, (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(row);
  });
});

// Close the database
db.close();