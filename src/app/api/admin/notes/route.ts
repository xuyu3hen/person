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

function sanitizeNote(input: unknown) {
  const obj = (input && typeof input === "object"
    ? (input as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  const content = typeof obj.content === "string" ? obj.content : "";
  const visibility = obj.visibility === "public" ? "public" : "private";
  const tags = Array.isArray(obj.tags)
    ? (obj.tags as unknown[])
        .filter((t) => typeof t === "string")
        .map((t) => (t as string).trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];

  if (!title) throw Object.assign(new Error("title is required"), { status: 400 });
  if (title.length > 200)
    throw Object.assign(new Error("title is too long"), { status: 400 });
  if (content.length > 200_000)
    throw Object.assign(new Error("content is too long"), { status: 400 });

  return { title, content, visibility, tags };
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
    const result = await sql`
      SELECT id, title, content, visibility, tags, created_at, updated_at
      FROM journal_notes
      ORDER BY created_at DESC;
    `;

    const notes = result.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        title: String(row.title),
        content: String(row.content),
        visibility: row.visibility === "public" ? "public" : "private",
        tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
        createdAt: new Date(String(row.created_at)).toISOString(),
        updatedAt: new Date(String(row.updated_at)).toISOString(),
      };
    });

    return NextResponse.json(notes);
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: getErrorStatus(e) });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
    const body = await req.json().catch(() => null);
    const cleaned = sanitizeNote(body);
    await ensureSchema();
    const sql = getSql();
    const now = new Date().toISOString();
    const id = randomUUID();

    const result = await sql`
      INSERT INTO journal_notes (id, title, content, visibility, tags, created_at, updated_at)
      VALUES (
        ${id},
        ${cleaned.title},
        ${cleaned.content},
        ${cleaned.visibility},
        ${JSON.stringify(cleaned.tags)}::jsonb,
        ${now}::timestamptz,
        ${now}::timestamptz
      )
      RETURNING id, title, content, visibility, tags, created_at, updated_at;
    `;

    const r = result.rows[0] as Record<string, unknown>;
    return NextResponse.json(
      {
        id: String(r.id),
        title: String(r.title),
        content: String(r.content),
        visibility: r.visibility === "public" ? "public" : "private",
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        createdAt: new Date(String(r.created_at)).toISOString(),
        updatedAt: new Date(String(r.updated_at)).toISOString(),
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: getErrorStatus(e) });
  }
}
