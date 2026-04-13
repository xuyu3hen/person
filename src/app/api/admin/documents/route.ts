import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureSchema } from "@/lib/db";
import { getAdminCookieName, verifyAdminSessionCookieValue } from "@/lib/admin-auth";

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
    const { rows } = await sql`
      SELECT id, title, type, file_url as "fileUrl", created_at as "createdAt", updated_at as "updatedAt"
      FROM journal_documents
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const data = await req.json();
    const { id, title, type, fileUrl, createdAt } = data;
    if (!id || !title || !type || !fileUrl) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }
    const sql = getSql();
    const now = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();
    
    await sql`
      INSERT INTO journal_documents (id, title, type, file_url, created_at, updated_at)
      VALUES (${id}, ${title}, ${type}, ${fileUrl}, ${now}, ${now})
    `;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
