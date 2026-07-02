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
    const { title, content, date, mood, weather, tags, photos } = body;

    if (!title || !content || !date) {
      throw Object.assign(new Error("Title, content, and date are required"), { status: 400 });
    }

    const now = new Date().toISOString();

    const result = await sql`
      UPDATE journal_diary
      SET
        date = ${date}::date,
        title = ${title},
        content = ${content},
        mood = ${mood || ""},
        weather = ${weather || ""},
        tags = ${JSON.stringify(tags || [])}::jsonb,
        photos = ${JSON.stringify(photos || [])}::jsonb,
        updated_at = ${now}::timestamptz
      WHERE id = ${id}
      RETURNING id, date, title, content, mood, weather, tags, photos, created_at, updated_at
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Diary entry not found" }, { status: 404 });
    }

    const r = result.rows[0] as Record<string, unknown>;
    const entry = {
      id: String(r.id),
      date: String(r.date).slice(0, 10),
      title: String(r.title),
      content: String(r.content),
      mood: r.mood ? String(r.mood) : "",
      weather: r.weather ? String(r.weather) : "",
      tags: Array.isArray(r.tags) ? r.tags : [],
      photos: Array.isArray(r.photos) ? r.photos : [],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };

    return NextResponse.json(entry);
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
      DELETE FROM journal_diary
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Diary entry not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
