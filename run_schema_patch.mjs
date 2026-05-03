import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';
for (const line of envFile.split('\n')) {
    if (line.startsWith('DATABASE_URL=')) {
        dbUrl = line.split('=')[1].trim();
        // remove quotes if any
        if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
            dbUrl = dbUrl.slice(1, -1);
        }
        break;
    }
}

if (!dbUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

const client = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Connecting to database...');
        // Add campaign_id column to tasks table if it does not exist
        const res = await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS campaign_id uuid;`);
        console.log('Successfully patched database schema.', res);
    } catch (err) {
        console.error('Failed to patch schema:', err);
    } finally {
        await client.end();
    }
}

run();
