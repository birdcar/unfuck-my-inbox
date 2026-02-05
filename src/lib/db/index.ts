import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

type DbType = ReturnType<typeof createDb>;

// Lazy initialization to avoid build-time errors
let _db: DbType | null = null;

export const db = new Proxy({} as DbType, {
  get(_, prop) {
    if (!_db) {
      _db = createDb();
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
