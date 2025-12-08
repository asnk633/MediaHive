const Database = require('better-sqlite3');

// Connect to the database
const db = new Database('dev.db');

try {
  // Check if there are any existing notifications
  const notificationCount = db.prepare("SELECT COUNT(*) as count FROM notifications").get();
  console.log(`Existing notifications: ${notificationCount.count}`);
  
  if (notificationCount.count > 0) {
    const notifications = db.prepare("SELECT * FROM notifications").all();
    console.log('Notifications:', notifications);
  }
} catch (error) {
  console.error('Error checking notifications:', error);
} finally {
  db.close();
}