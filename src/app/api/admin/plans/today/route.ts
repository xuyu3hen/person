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

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const sql = getSql();
    const date = todayYmd();
    const result = await sql`
      SELECT id, date, start_time, end_time, title, done, created_at, updated_at
      FROM journal_plans
      WHERE date = ${date}::date
      ORDER BY start_time NULLS LAST, created_at DESC;
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
        createdAt: new Date(String(row.created_at)).toISOString(),
        updatedAt: new Date(String(row.updated_at)).toISOString(),
      };
    });
    return NextResponse.json(plans);
  } catch (e: unknown) {
    const status =
      e && typeof e === "object" && "status" in e
        ? (e as { status?: unknown }).status
        : undefined;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: typeof status === "number" ? status : 500 }
    );
  }
}
