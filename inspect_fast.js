const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres.clcwyngisunbjzljzttv:asnk633%40mediathaiba@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
});

async function run() {
    const tables = ['tasks', 'events', 'campaigns', 'audit_log'];
    for (const t of tables) {
        try {
            const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [t]);
            console.log(`--- ${t} ---`);
            console.log(res.rows.map(r => r.column_name).join(', '));
        } catch (e) {
            console.error(`Error ${t}: ${e.message}`);
        }
    }
    await pool.end();
}
run();
