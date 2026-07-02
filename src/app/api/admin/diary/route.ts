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

export async function GET(req: NextRequest) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const sql = getSql();

    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    let rows: unknown[];
    if (limit && limit > 0) {
      const result = await sql`
        SELECT id, date, title, content, mood, weather, tags, photos, created_at, updated_at
        FROM journal_diary
        ORDER BY date DESC
        LIMIT ${limit}
      `;
      rows = result.rows;
    } else {
      const result = await sql`
        SELECT id, date, title, content, mood, weather, tags, photos, created_at, updated_at
        FROM journal_diary
        ORDER BY date DESC
      `;
      rows = result.rows;
    }

    const diary = rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
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
    });

    return NextResponse.json(diary);
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
    const { title, content, date, mood, weather, tags, photos } = body;

    if (!title || !content || !date) {
      throw Object.assign(new Error("Title, content, and date are required"), { status: 400 });
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const result = await sql`
      INSERT INTO journal_diary (id, date, title, content, mood, weather, tags, photos, created_at, updated_at)
      VALUES (
        ${id},
        ${date}::date,
        ${title},
        ${content},
        ${mood || ""},
        ${weather || ""},
        ${JSON.stringify(tags || [])}::jsonb,
        ${JSON.stringify(photos || [])}::jsonb,
        ${now}::timestamptz,
        ${now}::timestamptz
      )
      RETURNING id, date, title, content, mood, weather, tags, photos, created_at, updated_at
    `;

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

    return NextResponse.json(entry, { status: 201 });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
