import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminCookieName, verifyAdminSessionCookieValue } from "@/lib/admin-auth";
import { ensureSchema, getSql } from "@/lib/db";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ debug?: string }>;
};

export default async function AdminNoteReadPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const qs = await searchParams;
  const debug = qs?.debug === "1";

  const cookie = (await cookies()).get(getAdminCookieName())?.value;
  if (!verifyAdminSessionCookieValue(cookie)) {
    redirect("/admin");
  }

  await ensureSchema();
  const sql = getSql();
  const result = await sql`
    SELECT id, title, content, visibility, tags, created_at, updated_at
    FROM journal_notes
    WHERE id = ${id};
  `;
  if (!result.rows.length) {
    return (
      <div className="container py-10">
        <div className="card p-6">
          <div className="text-base font-semibold tracking-tight">未找到</div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">这条笔记可能已被删除。</div>
        </div>
      </div>
    );
  }

  const r = result.rows[0] as Record<string, unknown>;
  const title = String(r.title);
  const content = String(r.content);

  return (
    <div className="container py-8">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5">
        <div className="sr-only">{title}</div>
        <pre className="whitespace-pre-wrap break-words text-[15px] leading-[1.7]">
          {content}
        </pre>
      </div>
      {debug ? (
        <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
          <div className="text-sm font-semibold tracking-tight">Debug</div>
          <pre className="mt-2 text-xs whitespace-pre-wrap break-words">
            {JSON.stringify(r, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

