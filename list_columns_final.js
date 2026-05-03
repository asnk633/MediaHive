const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events'
      ORDER BY ordinal_position;
    `);
        console.log('--- ACTUAL EVENTS COLUMNS ---');
        console.log(res.rows.map(r => r.column_name).join('\n'));

        const res2 = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `);
        console.log('\n--- ACTUAL TASKS COLUMNS ---');
        console.log(res2.rows.map(r => r.column_name).join('\n'));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}
run();
