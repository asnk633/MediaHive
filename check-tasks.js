const Database = require('better-sqlite3');

// Connect to the database
const db = new Database('dev.db');

try {
  // Check if there are any existing tasks
  const taskCount = db.prepare("SELECT COUNT(*) as count FROM tasks").get();
  console.log(`Existing tasks: ${taskCount.count}`);
  
  if (taskCount.count > 0) {
    const tasks = db.prepare("SELECT * FROM tasks").all();
    console.log('Tasks:', tasks);
  }
} catch (error) {
  console.error('Error checking tasks:', error);
} finally {
  db.close();
}