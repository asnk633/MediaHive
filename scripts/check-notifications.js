const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('dev.db');

try {
    const rows = db.prepare(`
    SELECT id, type, title, body, user_id, created_at 
    FROM notifications 
    ORDER BY id DESC 
    LIMIT 20
  `).all();

    fs.writeFileSync('notification_output.json', JSON.stringify(rows, null, 2), 'utf8');
    console.log("Wrote to notification_output.json");

} catch (e) {
    console.error("Error:", e);
}
