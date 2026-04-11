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
      SELECT id, date, start_time, end_time, title, done, sort_order, created_at, updated_at
      FROM journal_plans
      WHERE date = ${date}::date
      ORDER BY sort_order ASC, start_time NULLS LAST, created_at DESC;
    `;

    const plans = result.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        date: new Date(String(row.date)).toISOString().slice(0, 10),
        startTime: row.start_time ? String(row.start_time).slice(0, 5) : "",
        endTime: row.end_time ? String(row.end_time).slice(0, 5) : "",
        title: String(row.title),
        done: row.done === true,
        sortOrder: Number(row.sort_order || 0),
        createdAt: new Date(String(row.created_at)).toISOString(),
        updatedAt: new Date(String(row.updated_at)).toISOString(),
      };
    });

    return NextResponse.json(plans);
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: getErrorStatus(e) });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
    const body = await req.json().catch(() => null);
    
    // Check if this is a bulk update request for sort_order
    if (Array.isArray(body)) {
      await ensureSchema();
      const sql = getSql();
      const updates = body.map((item: Record<string, unknown>, index: number) => {
        if (!item.id || typeof item.id !== 'string') return Promise.resolve();
        return sql`UPDATE journal_plans SET sort_order = ${index} WHERE id = ${item.id}`;
      });
      await Promise.all(updates);
      return NextResponse.json({ ok: true });
    }

    const cleaned = sanitizePlan(body);
    await ensureSchema();
    const sql = getSql();
    const now = new Date().toISOString();
    const id = randomUUID();

    const result = await sql`
      INSERT INTO journal_plans (id, date, start_time, end_time, title, done, created_at, updated_at)
      VALUES (
        ${id},
        ${cleaned.date}::date,
        ${cleaned.startTime ? cleaned.startTime + ':00' : null}::time,
        ${cleaned.endTime ? cleaned.endTime + ':00' : null}::time,
        ${cleaned.title},
        ${cleaned.done},
        ${now}::timestamptz,
        ${now}::timestamptz
      )
      RETURNING id, date, start_time, end_time, title, done, created_at, updated_at;
    `;

    const r = result.rows[0] as Record<string, unknown>;
    return NextResponse.json(
      {
        id: String(r.id),
        date: new Date(String(r.date)).toISOString().slice(0, 10),
        startTime: r.start_time ? String(r.start_time).slice(0, 5) : "",
        endTime: r.end_time ? String(r.end_time).slice(0, 5) : "",
        title: String(r.title),
        done: r.done === true,
        createdAt: new Date(String(r.created_at)).toISOString(),
        updatedAt: new Date(String(r.updated_at)).toISOString(),
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: getErrorStatus(e) });
  }
}
