import 'server-only';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';

/**
 * Postgres (Supabase) through the transaction pooler. One pool per server
 * instance, kept on globalThis so dev hot-reloads don't leak connections.
 * The pooler's certificate is signed by Supabase's own CA, so the connection is
 * encrypted but not verified against the system store.
 */
const g = globalThis as unknown as { __pePool?: Pool };

export const hasDatabase = () => !!process.env.DATABASE_URL;

function pool() {
  if (!g.__pePool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (see .env.example).');
    g.__pePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return g.__pePool;
}

export async function sql<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool().query<T>(text, params);
  return res.rows;
}

/** Runs `fn` in a transaction; rolls back if it throws. */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query('begin');
    const out = await fn(client);
    await client.query('commit');
    return out;
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
