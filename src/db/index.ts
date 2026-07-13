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
      const betterSqlite = await import('better-sqlite3');
      
      let Database: any = betterSqlite;
      while (Database && typeof Database !== 'function' && Database.default) {
        Database = Database.default;
      }
      if (typeof Database !== 'function') {
        Database = betterSqlite.default || betterSqlite;
      }
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

let _initPromise: Promise<any> | null = null;

export async function getDb(): Promise<any> {
  if (_db) return _db;
  if (!_initPromise) {
    _initPromise = initializeDatabase().then(db => {
      _db = db;
      return db;
    });
  }
  return _initPromise;
}

export type Database = any;
