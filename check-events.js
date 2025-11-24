const Database = require('better-sqlite3');

// Connect to the database
const db = new Database('dev.db');

try {
  // Check if there are any existing events
  const eventCount = db.prepare("SELECT COUNT(*) as count FROM events").get();
  console.log(`Existing events: ${eventCount.count}`);
  
  if (eventCount.count > 0) {
    const events = db.prepare("SELECT * FROM events").all();
    console.log('Events:', events);
  }
} catch (error) {
  console.error('Error checking events:', error);
} finally {
  db.close();
}