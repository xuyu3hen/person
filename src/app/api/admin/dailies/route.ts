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
    if (!isValidDateYmd(date)) {
      throw Object.assign(new Error("date query param is required (YYYY-MM-DD)"), {
        status: 400,
      });
    }

    const result = await sql`
      SELECT id, date, weight, created_at, updated_at
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

    const id = randomUUID();
    const now = new Date().toISOString();

    const result = await sql`
      INSERT INTO journal_dailies (id, date, weight, created_at, updated_at)
      VALUES (${id}, ${date}::date, ${weight}, ${now}::timestamptz, ${now}::timestamptz)
      ON CONFLICT (date) DO UPDATE SET
        weight = EXCLUDED.weight,
        updated_at = EXCLUDED.updated_at
      RETURNING id, date, weight, created_at, updated_at;
    `;

    const row = result.rows[0] as Record<string, unknown>;
    return NextResponse.json({
      id: String(row.id),
      date: new Date(String(row.date)).toISOString().slice(0, 10),
      weight: row.weight === null ? null : Number(row.weight),
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as any).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
