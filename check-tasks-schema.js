const { Database } = require('sqlite3').verbose();

// Open the database
const db = new Database('./dev.db');

// Query tasks schema
db.serialize(() => {
  db.each(`SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'`, (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(row);
  });
});

// Close the database
db.close();