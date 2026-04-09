import { NextResponse } from "next/server";

import { ensureSchema, getSql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  await ensureSchema();
  const sql = getSql();
  const result = await sql`
    SELECT id, title, content, visibility, tags, created_at, updated_at
    FROM journal_notes
    WHERE visibility = 'public'
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
}
