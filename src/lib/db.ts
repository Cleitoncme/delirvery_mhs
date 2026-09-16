import { Pool, type PoolClient, type QueryResultRow } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL precisa ser definida em produção.");
}

declare global {
  var deliveryMhsPool: Pool | undefined;
}

export const db =
  global.deliveryMhsPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== "production") global.deliveryMhsPool = db;

export async function query<T extends QueryResultRow>(
  text: string,
  values?: unknown[],
) {
  return db.query<T>(text, values);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
