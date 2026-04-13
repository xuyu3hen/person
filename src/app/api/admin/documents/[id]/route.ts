import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureSchema } from "@/lib/db";
import { getAdminCookieName, verifyAdminSessionCookieValue } from "@/lib/admin-auth";
import { del } from "@vercel/blob";

export const runtime = "nodejs";

function assertAdmin(req: NextRequest) {
  const cookie = req.cookies.get(getAdminCookieName())?.value;
  if (!verifyAdminSessionCookieValue(cookie)) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const id = (await params).id;
    const sql = getSql();
    
    // get url to delete blob
    const { rows } = await sql`
      SELECT file_url as "fileUrl" FROM journal_documents WHERE id = ${id}
    `;
    
    if (rows.length > 0) {
      const fileUrl = String((rows[0] as { fileUrl: string }).fileUrl);
      if (fileUrl.includes('.vercel-storage.com')) {
        try {
          await del(fileUrl);
        } catch {
          // ignore blob delete error
        }
      }
    }

    await sql`DELETE FROM journal_documents WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}
