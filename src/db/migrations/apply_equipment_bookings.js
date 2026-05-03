const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
    if (!DATABASE_URL) throw new Error("NO DATABASE_URL set in .env");
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Add units_requested column (idempotent, safe to re-run)
        await pool.query(`
            ALTER TABLE equipment_bookings 
            ADD COLUMN IF NOT EXISTS units_requested INTEGER NOT NULL DEFAULT 1;
        `);
        console.log("Added units_requested column to equipment_bookings.");
    } finally {
        await pool.end();
    }
}

run().catch(console.error);
