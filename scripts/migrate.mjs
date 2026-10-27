import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import nextEnv from "@next/env";
import pg from "pg";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DIRECT_URL) throw new Error("DIRECT_URL is required for migrations");
const url = new URL(process.env.DIRECT_URL);
if (url.hostname.includes("-pooler")) throw new Error("DIRECT_URL must be a non-pooled connection");
const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(730030)");
  await client.query(`CREATE TABLE IF NOT EXISTS public.hrms_schema_migrations (
    name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const directory = fileURLToPath(new URL("../migrations/", import.meta.url));
  for (const name of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
    const sql = await readFile(`${directory}/${name}`, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const { rows } = await client.query("SELECT checksum FROM public.hrms_schema_migrations WHERE name = $1", [name]);
    if (rows[0]) {
      if (rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
      console.log(`Already applied: ${name}`);
      continue;
    }
    await client.query(sql);
    await client.query("INSERT INTO public.hrms_schema_migrations (name, checksum) VALUES ($1, $2)", [name, checksum]);
    console.log(`Applied: ${name}`);
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  // Never log a connection string or driver error containing credentials.
  console.error(error instanceof Error ? error.message : "Migration failed");
  process.exitCode = 1;
} finally {
  await client.end();
}
