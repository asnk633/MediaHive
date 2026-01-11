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
      const dbPath = (process.env.DATABASE_URL || 'file:./dev2.db').replace(/^file:/, '');
      const sqlite = new Database(dbPath);
      _db = drizzleSqlite(sqlite, { schema });
    }
    return _db;
  })();

  return dbPromise;
}

// Export a proxy that initializes on first access
export const db = new Proxy({} as any, {
  get(target, prop) {
    if (!_db || !_db[prop]) {
      throw new Error('Database not initialized. Call initializeDatabase() first or use getDb()');
    }
    return _db[prop];
  }
});

// Export async getter for safer usage
export async function getDb() {
  return initializeDatabase();
}

export type Database = any;