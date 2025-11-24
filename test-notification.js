const Database = require('better-sqlite3');

// Connect to the database
const db = new Database('dev.db');

try {
  // Try to insert a notification
  const stmt = db.prepare("INSERT INTO notifications (user_id, type, title, body, read, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const result = stmt.run(1, "system", "Welcome", "Seed complete — welcome to Thaiba Garden Media Manager.", 0, JSON.stringify({ seed: true }), new Date().toISOString(), new Date().toISOString());
  console.log('Notification inserted successfully!', result);
} catch (error) {
  console.error('Error inserting notification:', error);
} finally {
  db.close();
}