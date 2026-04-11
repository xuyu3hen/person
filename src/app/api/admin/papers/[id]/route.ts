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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const sql = getSql();
    
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || !body.title || !body.authors || !body.year || !body.journal) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }

    const pdfUrl = typeof body.pdfUrl === "string" ? body.pdfUrl.trim() : null;
    const bibtex = typeof body.bibtex === "string" ? body.bibtex.trim() : null;
    const now = new Date().toISOString();

    const result = await sql`
      UPDATE journal_papers
      SET title = ${body.title},
          authors = ${body.authors},
          year = ${Number(body.year)},
          journal = ${body.journal},
          pdf_url = ${pdfUrl},
          bibtex = ${bibtex},
          updated_at = ${now}::timestamptz
      WHERE id = ${id}
      RETURNING id, title, authors, year, journal, pdf_url, bibtex, created_at, updated_at;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = result.rows[0] as Record<string, unknown>;
    return NextResponse.json({
      id: String(row.id),
      title: String(row.title),
      authors: String(row.authors),
      year: Number(row.year),
      journal: String(row.journal),
      pdfUrl: row.pdf_url ? String(row.pdf_url) : null,
      bibtex: row.bibtex ? String(row.bibtex) : null,
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const sql = getSql();
    
    const { id } = await params;

    const result = await sql`
      DELETE FROM journal_papers WHERE id = ${id} RETURNING id;
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
