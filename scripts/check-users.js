const Database = require('better-sqlite3');
const db = new Database('dev.db');

try {
    const rows = db.prepare('SELECT id, email, role, full_name FROM users WHERE id IN (1, 4)').all();
    console.log(JSON.stringify(rows, null, 2));
} catch (e) {
    console.error("Error:", e);
}
