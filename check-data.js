const Database = require('better-sqlite3');

// Connect to the database
const db = new Database('dev.db');

try {
  // Check if there are any existing records
  const tenantCount = db.prepare("SELECT COUNT(*) as count FROM tenants").get();
  const institutionCount = db.prepare("SELECT COUNT(*) as count FROM institutions").get();
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  
  console.log(`Existing records:`);
  console.log(`- Tenants: ${tenantCount.count}`);
  console.log(`- Institutions: ${institutionCount.count}`);
  console.log(`- Users: ${userCount.count}`);
} catch (error) {
  console.error('Error checking data:', error);
} finally {
  db.close();
}