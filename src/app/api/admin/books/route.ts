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

function toCamel(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title),
    author: String(row.author),
    isbn: row.isbn ? String(row.isbn) : "",
    rating: Number(row.rating),
    notes: row.notes ? String(row.notes) : "",
    status: String(row.status),
    startedAt: row.started_at ? String(row.started_at) : null,
    finishedAt: row.finished_at ? String(row.finished_at) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const sql = getSql();
    const result = await sql`
      SELECT id, title, author, isbn, rating, notes, status, started_at, finished_at, created_at, updated_at
      FROM journal_books
      ORDER BY created_at DESC;
    `;
    return NextResponse.json(result.rows.map((r) => toCamel(r as Record<string, unknown>)));
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const sql = getSql();

    const body = await req.json().catch(() => null);
    if (!body || !body.title) {
      throw Object.assign(new Error("Missing required field: title"), { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const validStatuses = ["want", "reading", "finished", "dropped"];
    const status = validStatuses.includes(body.status) ? body.status : "reading";
    const rating = Math.min(5, Math.max(0, Number(body.rating) || 0));

    const result = await sql`
      INSERT INTO journal_books (id, title, author, isbn, rating, notes, status, started_at, finished_at, created_at, updated_at)
      VALUES (${id}, ${body.title}, ${body.author || ""}, ${body.isbn || ""}, ${rating}, ${body.notes || ""}, ${status}, ${body.startedAt || null}::date, ${body.finishedAt || null}::date, ${now}::timestamptz, ${now}::timestamptz)
      RETURNING id, title, author, isbn, rating, notes, status, started_at, finished_at, created_at, updated_at;
    `;

    return NextResponse.json(toCamel(result.rows[0] as Record<string, unknown>));
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
