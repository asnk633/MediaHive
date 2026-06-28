const Database = require('better-sqlite3');
const db = new Database('./dev.db');

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_layouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_context TEXT NOT NULL,
      layout_json TEXT NOT NULL,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id),
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("dashboard_layouts table created successfully.");
} catch (error) {
  console.error("Error creating table:", error);
} finally {
  db.close();
}
