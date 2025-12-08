// src/db/index.ts
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient as createLibsqlClient } from '@libsql/client';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema'; // keep relative path to avoid alias issues

const TURSO_URL = process.env.TURSO_CONNECTION_URL;
const TURSO_PLACEHOLDER = 'your_turso_connection_url_here';

let db: any;

// If we have a valid Turso/LibSQL URL, use the HTTP libsql client
// Only use Turso if the URL starts with libsql:// or https://
if (TURSO_URL && TURSO_URL !== TURSO_PLACEHOLDER && (TURSO_URL.startsWith('libsql://') || TURSO_URL.startsWith('https://'))) {
  const client = createLibsqlClient({
    url: TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  db = drizzleLibsql(client, { schema });
} else {
  // Local SQLite via better-sqlite3
  const dbPath = (process.env.DATABASE_URL || 'file:./dev.db').replace(/^file:/, '');
  const sqlite = new Database(dbPath);
  db = drizzleSqlite(sqlite, { schema });
}

export { db };
export type Database = any;