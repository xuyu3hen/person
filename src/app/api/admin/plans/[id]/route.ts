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

function isValidTimeHm(s: string) {
  return /^\d{2}:\d{2}$/.test(s);
}

function sanitizePlan(input: unknown) {
  const obj = (input && typeof input === "object"
    ? (input as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const date = typeof obj.date === "string" && isValidDateYmd(obj.date)
    ? obj.date
    : "";
  const startTime =
    typeof obj.startTime === "string" && isValidTimeHm(obj.startTime)
      ? obj.startTime
      : "";
  const endTime =
    typeof obj.endTime === "string" && isValidTimeHm(obj.endTime)
      ? obj.endTime
      : "";
  const done = obj.done === true;

  if (!title) throw Object.assign(new Error("title is required"), { status: 400 });
  if (title.length > 200)
    throw Object.assign(new Error("title is too long"), { status: 400 });
  if (!date) throw Object.assign(new Error("date is required"), { status: 400 });
  if (startTime && endTime && startTime > endTime) {
    throw Object.assign(new Error("startTime must be <= endTime"), { status: 400 });
  }
  return { title, date, startTime, endTime, done };
}

function getErrorStatus(e: unknown) {
  if (e && typeof e === "object" && "status" in e) {
    const s = (e as { status?: unknown }).status;
    if (typeof s === "number") return s;
  }
  return 500;
}

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Internal error";
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertAdmin(req);
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const cleaned = sanitizePlan(body);
    await ensureSchema();
    const sql = getSql();
    const now = new Date().toISOString();

    const result = await sql`
      UPDATE journal_plans
      SET date = ${cleaned.date}::date,
          start_time = ${cleaned.startTime ? cleaned.startTime + ':00' : null}::time,
          end_time = ${cleaned.endTime ? cleaned.endTime + ':00' : null}::time,
          title = ${cleaned.title},
          done = ${cleaned.done},
          updated_at = ${now}::timestamptz
      WHERE id = ${id}
      RETURNING id, date, start_time, end_time, title, done, created_at, updated_at;
    `;

    if (!result.rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const r = result.rows[0] as Record<string, unknown>;
    return NextResponse.json({
      id: String(r.id),
      date: new Date(String(r.date)).toISOString().slice(0, 10),
      startTime: r.start_time ? String(r.start_time).slice(0, 5) : "",
      endTime: r.end_time ? String(r.end_time).slice(0, 5) : "",
      title: String(r.title),
      done: r.done === true,
      createdAt: new Date(String(r.created_at)).toISOString(),
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: getErrorStatus(e) });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertAdmin(req);
    const { id } = await params;
    await ensureSchema();
    const sql = getSql();
    const result = await sql`
      DELETE FROM journal_plans
      WHERE id = ${id}
      RETURNING id;
    `;
    if (!result.rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: getErrorStatus(e) });
  }
}
