import { Client } from 'pg';

async function test() {
    const url = 'postgres://postgres:ChangeMe123!@db.fcctcorycpvebupluzpe.supabase.co:5432/postgres';
    console.log('Testing connection to ' + url.split('@')[1]);
    const client = new Client({ connectionString: url });
    try {
        await client.connect();
        console.log('✅ DATABASE_CONNECTION_SUCCESS');
        const res = await client.query("SELECT conname FROM pg_constraint WHERE conname = 'profiles_id_fkey'");
        console.log('CONSTRAINTS:', JSON.stringify(res.rows));
        await client.end();
    } catch (err: any) {
        console.error('❌ DATABASE_CONNECTION_FAIL:', err.message);
    }
}

test();
