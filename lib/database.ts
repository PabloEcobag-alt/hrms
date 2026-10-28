import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

export type Database = {
  query<T>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>;
};

let pool: Pool | undefined;
export const database: Database = {
  async query<T>(sql: string, values?: unknown[]) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    if (!pool) {
      pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
      attachDatabasePool(pool);
    }
    const result = await pool.query(sql, values);
    return { rows: result.rows as T[] };
  },
};

