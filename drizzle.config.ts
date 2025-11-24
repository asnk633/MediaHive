
import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';

const TURSO_URL = process.env.TURSO_CONNECTION_URL;
const TURSO_PLACEHOLDER = 'your_turso_connection_url_here';

const dbConfig: Config = defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: TURSO_URL && TURSO_URL !== TURSO_PLACEHOLDER ? 'turso' : 'sqlite',
  dbCredentials: TURSO_URL && TURSO_URL !== TURSO_PLACEHOLDER ? {
    url: TURSO_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  } : {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
});

export default dbConfig;