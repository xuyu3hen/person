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

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const sql = getSql();
    
    // allow public read, no assertAdmin needed here if we want to show on frontend
    const result = await sql`
      SELECT id, title, authors, year, journal, pdf_url, bibtex, created_at, updated_at
      FROM journal_papers
      ORDER BY year DESC, created_at DESC;
    `;

    const papers = result.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        title: String(row.title),
        authors: String(row.authors),
        year: Number(row.year),
        journal: String(row.journal),
        pdfUrl: row.pdf_url ? String(row.pdf_url) : null,
        bibtex: row.bibtex ? String(row.bibtex) : null,
        createdAt: new Date(String(row.created_at)).toISOString(),
        updatedAt: new Date(String(row.updated_at)).toISOString(),
      };
    });

    return NextResponse.json(papers);
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

    const body = await req.json().catch(() => null);
    if (!body || !body.title || !body.authors || !body.year || !body.journal) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    
    const pdfUrl = typeof body.pdfUrl === "string" ? body.pdfUrl.trim() : null;
    const bibtex = typeof body.bibtex === "string" ? body.bibtex.trim() : null;

    const result = await sql`
      INSERT INTO journal_papers (id, title, authors, year, journal, pdf_url, bibtex, created_at, updated_at)
      VALUES (${id}, ${body.title}, ${body.authors}, ${Number(body.year)}, ${body.journal}, ${pdfUrl}, ${bibtex}, ${now}::timestamptz, ${now}::timestamptz)
      RETURNING id, title, authors, year, journal, pdf_url, bibtex, created_at, updated_at;
    `;

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
