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

export async function GET() {
  try {
    await ensureSchema();
    const sql = getSql();

    const result = await sql`
      SELECT id, text, done, sort_order, created_at, updated_at
      FROM journal_todos
      ORDER BY sort_order, created_at
    `;

    const todos = result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        text: String(r.text),
        done: Boolean(r.done),
        sortOrder: Number(r.sort_order),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      };
    });

    return NextResponse.json(todos);
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

    const body = await req.json();

    // Bulk sort update
    if (Array.isArray(body)) {
      for (const item of body as { id: string; sortOrder: number }[]) {
        await sql`
          UPDATE journal_todos
          SET sort_order = ${item.sortOrder}, updated_at = ${new Date().toISOString()}::timestamptz
          WHERE id = ${item.id}
        `;
      }
      return NextResponse.json({ ok: true });
    }

    // Single create
    const { text } = body;
    if (!text || !text.trim()) {
      throw Object.assign(new Error("Text is required"), { status: 400 });
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    // Get max sort_order
    const maxResult = await sql`SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM journal_todos`;
    const maxSort = Number((maxResult.rows[0] as Record<string, unknown>).max_sort) ?? -1;

    const result = await sql`
      INSERT INTO journal_todos (id, text, done, sort_order, created_at, updated_at)
      VALUES (
        ${id},
        ${text.trim()},
        FALSE,
        ${maxSort + 1},
        ${now}::timestamptz,
        ${now}::timestamptz
      )
      RETURNING id, text, done, sort_order, created_at, updated_at
    `;

    const r = result.rows[0] as Record<string, unknown>;
    const todo = {
      id: String(r.id),
      text: String(r.text),
      done: Boolean(r.done),
      sortOrder: Number(r.sort_order),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };

    return NextResponse.json(todo, { status: 201 });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
