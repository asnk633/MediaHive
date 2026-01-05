const Database = require('better-sqlite3');
const path = require('path');

// Force dev.db if DATABASE_URL is not set to a file path
const dbPath = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('file:', '') : 'dev.db';
console.log('------------------------------------------------');
console.log(`[MIGRATION] Target Database File: ${dbPath} `);
console.log('------------------------------------------------');

const db = new Database(dbPath);

function runMigration() {
    try {
        console.log('Starting migration...');

        // 1. Attendance Columns
        const columnsToAdd = [
            { name: 'worked_minutes', type: 'INTEGER DEFAULT 0' },
            { name: 'late_arrival', type: 'INTEGER DEFAULT 0' },
            { name: 'early_exit', type: 'INTEGER DEFAULT 0' },
            { name: 'pending_tasks_at_checkout', type: 'INTEGER DEFAULT 0' },
            { name: 'completed_tasks_today', type: 'INTEGER DEFAULT 0' },
            { name: 'approved_early_exit', type: 'INTEGER DEFAULT 0' },
            { name: 'negative_discipline_event', type: 'INTEGER DEFAULT 0' },
            { name: 'marked_by', type: 'INTEGER REFERENCES users(id)' },
            { name: 'notes', type: 'TEXT' },
            { name: 'status', type: 'TEXT' }
        ];

        columnsToAdd.forEach(col => {
            try {
                db.prepare(`ALTER TABLE attendance ADD COLUMN ${col.name} ${col.type} `).run();
                console.log(`Added column: ${col.name} `);
            } catch (e) {
                if (e.message.includes('duplicate column name')) {
                    console.log(`Column ${col.name} already exists.`);
                } else {
                    console.error(`Error adding column ${col.name}: `, e.message);
                }
            }
        });

        // 2. Performance Snapshots Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS performance_snapshots(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    period TEXT NOT NULL,
    assigned_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    on_time_completed_tasks INTEGER DEFAULT 0,
    overdue_tasks INTEGER DEFAULT 0,
    task_completion_rate REAL DEFAULT 0,
    on_time_rate REAL DEFAULT 0,
    overdue_load_ratio REAL DEFAULT 0,
    avg_delay_hours REAL DEFAULT 0,
    avg_daily_hours REAL DEFAULT 0,
    attendance_discipline_score REAL DEFAULT 0,
    individual_performance_score REAL DEFAULT 0,
    performance_status TEXT NOT NULL,
    negative_discipline_days INTEGER DEFAULT 0,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    generated_at TEXT NOT NULL
)
    `).run();
        console.log('Ensured table exists: performance_snapshots');

        // 3. Department Health Snapshots Table
        db.prepare(`
            CREATE TABLE IF NOT EXISTS department_health_snapshots(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        period TEXT NOT NULL,
        total_tasks INTEGER DEFAULT 0,
        completed_tasks INTEGER DEFAULT 0,
        overdue_tasks INTEGER DEFAULT 0,
        avg_completion_rate REAL DEFAULT 0,
        avg_on_time_rate REAL DEFAULT 0,
        avg_attendance_score REAL DEFAULT 0,
        department_health_score REAL DEFAULT 0,
        health_status TEXT NOT NULL,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        generated_at TEXT NOT NULL
    )
    `).run();
        console.log('Ensured table exists: department_health_snapshots');

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
