import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminSessionCookieValue } from "@/lib/admin-auth";
import { ensureSchema, getSql } from "@/lib/db";

export const runtime = "nodejs";

function assertAdmin(req: NextRequest) {
  const cookie = req.cookies.get(getAdminCookieName())?.value;
  if (!verifyAdminSessionCookieValue(cookie)) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}

function isValidDateYmd(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export async function GET(req: NextRequest) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const sql = getSql();
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? "";

    if (date === "all") {
      // return all histories
      const result = await sql`
        SELECT id, date, weight, masturbated, created_at, updated_at
        FROM journal_dailies
        ORDER BY date DESC;
      `;
      const all = result.rows.map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: String(row.id),
          date: new Date(String(row.date)).toISOString().slice(0, 10),
          weight: row.weight === null ? null : Number(row.weight),
          masturbated: row.masturbated === true,
          createdAt: new Date(String(row.created_at)).toISOString(),
          updatedAt: new Date(String(row.updated_at)).toISOString(),
        };
      });
      return NextResponse.json(all);
    }

    if (!isValidDateYmd(date)) {
      throw Object.assign(new Error("date query param is required (YYYY-MM-DD) or 'all'"), {
        status: 400,
      });
    }

    const result = await sql`
      SELECT id, date, weight, masturbated, created_at, updated_at
      FROM journal_dailies
      WHERE date = ${date}::date
      LIMIT 1;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(null);
    }

    const row = result.rows[0] as Record<string, unknown>;
    return NextResponse.json({
      id: String(row.id),
      date: new Date(String(row.date)).toISOString().slice(0, 10),
      weight: row.weight === null ? null : Number(row.weight),
      masturbated: row.masturbated === true,
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as any).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const sql = getSql();

    const body = await req.json();
    const date = body.date;
    if (!date || !isValidDateYmd(date)) {
      throw Object.assign(new Error("Valid date is required"), { status: 400 });
    }

    const weight = typeof body.weight === "number" ? body.weight : null;
    const masturbated = body.masturbated === true;

    const id = randomUUID();
    const now = new Date().toISOString();

    const result = await sql`
      INSERT INTO journal_dailies (id, date, weight, masturbated, created_at, updated_at)
      VALUES (${id}, ${date}::date, ${weight}, ${masturbated}, ${now}::timestamptz, ${now}::timestamptz)
      ON CONFLICT (date) DO UPDATE SET
        weight = EXCLUDED.weight,
        masturbated = EXCLUDED.masturbated,
        updated_at = EXCLUDED.updated_at
      RETURNING id, date, weight, masturbated, created_at, updated_at;
    `;

    const row = result.rows[0] as Record<string, unknown>;
    return NextResponse.json({
      id: String(row.id),
      date: new Date(String(row.date)).toISOString().slice(0, 10),
      weight: row.weight === null ? null : Number(row.weight),
      masturbated: row.masturbated === true,
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as any).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
