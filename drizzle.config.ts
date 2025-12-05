import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';

const TURSO_URL = process.env.TURSO_CONNECTION_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const TURSO_PLACEHOLDER = 'your_turso_connection_url_here';

const useTurso = TURSO_URL &&
  TURSO_URL !== TURSO_PLACEHOLDER &&
  TURSO_TOKEN &&
  (TURSO_URL.startsWith('libsql://') || TURSO_URL.startsWith('https://'));

const dbConfig: Config = defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: useTurso ? 'turso' : 'sqlite',
  dbCredentials: useTurso ? {
    url: TURSO_URL!,
    authToken: TURSO_TOKEN!,
  } : {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
});

export default dbConfig;