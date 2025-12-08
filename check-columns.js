const Database = require('better-sqlite3');

// Connect to the database
const db = new Database('dev.db');

try {
  // Get the schema for the tasks table
  const schema = db.prepare("PRAGMA table_info(tasks)").all();
  console.log('Tasks table columns:');
  schema.forEach(column => {
    console.log(`- ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? 'DEFAULT ' + column.dflt_value : ''}`);
  });
  
  // Get the schema for the events table
  const eventsSchema = db.prepare("PRAGMA table_info(events)").all();
  console.log('\nEvents table columns:');
  eventsSchema.forEach(column => {
    console.log(`- ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? 'DEFAULT ' + column.dflt_value : ''}`);
  });
  
  // Get the schema for the notifications table
  const notificationsSchema = db.prepare("PRAGMA table_info(notifications)").all();
  console.log('\nNotifications table columns:');
  notificationsSchema.forEach(column => {
    console.log(`- ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? 'DEFAULT ' + column.dflt_value : ''}`);
  });
} catch (error) {
  console.error('Error checking schema:', error);
} finally {
  db.close();
}