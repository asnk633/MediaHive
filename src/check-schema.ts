import { getDb } from './db';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const db = await getDb();
    const result = await db.all(sql`PRAGMA table_info(audit_log)`);
    console.log('AUDIT_LOG_COLUMNS:', JSON.stringify(result, null, 2));
    
    // Check other common column names if timestamp is missing
    const hasTimestamp = result.some((c: any) => c.name === 'timestamp');
    const hasCreatedAt = result.some((c: any) => c.name === 'created_at');
    
    console.log('CONTEXT:', { hasTimestamp, hasCreatedAt });
    
    const data = await db.all(sql`SELECT * FROM audit_log LIMIT 1`);
    if (data.length > 0) {
      console.log('REAL_ROW_KEYS:', JSON.stringify(Object.keys(data[0]), null, 2));
    }
  } catch (e) {
    console.error('FAILED:', e);
  }
}

check();
