const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
    if (!DATABASE_URL) throw new Error("NO DB URL");
    console.log("Connecting...");
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS task_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
                user_id TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log("Created table task_comments!");

        // Enable realtime for the table
        await pool.query(`
            ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
        `).catch(e => console.log("Realtime publication failed, maybe already added or different config", e.message));

        console.log("Migration complete.");
    } finally {
        await pool.end();
    }
}

run().catch(console.error);
