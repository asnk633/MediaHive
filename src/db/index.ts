// src/db/index.ts
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient as createLibsqlClient } from '@libsql/client';
import * as schema from './schema'; // keep relative path to avoid alias issues

const TURSO_URL = process.env.TURSO_CONNECTION_URL;
const TURSO_PLACEHOLDER = 'your_turso_connection_url_here';

let _db: any = null;
let dbPromise: Promise<any> | null = null;

async function initializeDatabase() {
  if (_db) return _db;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    // If we have a valid Turso/LibSQL URL, use the HTTP libsql client
    // Only use Turso if the URL starts with libsql:// or https://
    if (TURSO_URL && TURSO_URL !== TURSO_PLACEHOLDER && (TURSO_URL.startsWith('libsql://') || TURSO_URL.startsWith('https://'))) {
      const client = createLibsqlClient({
        url: TURSO_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      _db = drizzleLibsql(client, { schema });
    } else {
      // Local SQLite via better-sqlite3 (dynamic import to avoid build issues)
      const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
      const Database = (await import('better-sqlite3')).default;
      // Use LOCAL_DB_PATH if provided, otherwise default to dev3.db (switched from dev2 due to locks)
      const path = await import('path');
      const fs = await import('fs');
      const rawDbUrl = process.env.LOCAL_DB_PATH || process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'dev3.db')}`;

      // If DATABASE_URL looks like Postgres, and we don't have a dedicated LOCAL_DB_PATH,
      // fallback to the default dev3.db file.
      const isPostgres = rawDbUrl.startsWith('postgresql://') || rawDbUrl.startsWith('postgres://');
      const finalDbUrl = (isPostgres && !process.env.LOCAL_DB_PATH)
        ? `file:${path.join(process.cwd(), 'dev3.db')}`
        : rawDbUrl;

      const dbPath = finalDbUrl.replace(/^file:/, '');
      console.log(`[DB] Final resolved path: ${dbPath}`);

      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir) && !dbPath.includes('http')) {
        console.log(`[DB] Creating directory: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
      }

      const sqlite = new Database(dbPath);
      _db = drizzleSqlite(sqlite, { schema });
    }
    return _db;
  })();

  return dbPromise;
}

// Export a proxy that initializes on first access
export const db = new Proxy({} as Record<string, any>, {
  get(target, prop) {
    if (!_db) {
      // In a synchronous proxy getter, we can't await initializeDatabase()
      // This is a known limitation of this specific architecture choice.
      // However, we can return the property from the _db if it exists, 
      // otherwise we throw a more helpful error.
      // To fix this properly, we should ensure initializeDatabase is called at boot.
      throw new Error('Database not initialized. Call getDb() or ensure initializeDatabase() is called at app start.');
    }
    return _db[prop];
  }
});

// Export async getter for safer usage
export async function getDb() {
  return initializeDatabase();
}

export type Database = any;
