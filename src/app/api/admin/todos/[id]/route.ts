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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const sql = getSql();
    const { id } = await params;

    const body = await req.json();
    const { text, done } = body;

    const now = new Date().toISOString();

    const result = await sql`
      UPDATE journal_todos
      SET
        text = COALESCE(${text ?? null}, text),
        done = COALESCE(${done ?? null}, done),
        updated_at = ${now}::timestamptz
      WHERE id = ${id}
      RETURNING id, text, done, sort_order, created_at, updated_at
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    const r = result.rows[0] as Record<string, unknown>;
    const todo = {
      id: String(r.id),
      text: String(r.text),
      done: Boolean(r.done),
      sortOrder: Number(r.sort_order),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };

    return NextResponse.json(todo);
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const sql = getSql();
    const { id } = await params;

    const result = await sql`
      DELETE FROM journal_todos
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
