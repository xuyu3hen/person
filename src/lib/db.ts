import { neon } from "@neondatabase/serverless";

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    ""
  );
}

type SqlClient = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<{ rows: unknown[] }>;

let cachedSql: SqlClient | undefined;

let schemaEnsured: Promise<void> | null = null;

export function getSql() {
  if (cachedSql) return cachedSql;
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Database is not configured. Set DATABASE_URL (Neon/Vercel Postgres) in environment variables."
    );
  }
  cachedSql = neon(url, { fullResults: true }) as unknown as SqlClient;
  return cachedSql;
}

export async function ensureSchema() {
  if (schemaEnsured) return schemaEnsured;
  schemaEnsured = (async () => {
    const sql = getSql();
    await sql`
      CREATE TABLE IF NOT EXISTS journal_notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        visibility TEXT NOT NULL CHECK (visibility IN ('private','public')),
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS journal_plans (
        id TEXT PRIMARY KEY,
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS journal_dailies (
        id TEXT PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        weight FLOAT,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS journal_notes_visibility_created_at_idx
      ON journal_notes (visibility, created_at DESC);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS journal_plans_date_start_time_idx
      ON journal_plans (date, start_time);
    `;
  })();
  return schemaEnsured;
}
