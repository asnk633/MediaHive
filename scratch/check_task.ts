const Database = require('better-sqlite3');
const db = new Database('./dev.db');
const rows = db.prepare('SELECT id, title FROM tasks LIMIT 10').all();
console.log('All Tasks:', JSON.stringify(rows, null, 2));
db.close();
