import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminCookieName, verifyAdminSessionCookieValue } from "@/lib/admin-auth";
import { ensureSchema, getSql } from "@/lib/db";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminNoteDetailPage({ params }: PageProps) {
  const { id } = await params;
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
          <div className="mt-2 text-sm text-[color:var(--muted)]">
            这条笔记可能已被删除。
          </div>
        </div>
      </div>
    );
  }

  const r = result.rows[0] as Record<string, unknown>;
  const title = String(r.title);
  const content = String(r.content);
  const visibility = r.visibility === "public" ? "public" : "private";
  const tags = Array.isArray(r.tags) ? (r.tags as string[]) : [];
  const createdAt = new Date(String(r.created_at));
  const updatedAt = new Date(String(r.updated_at));

  return (
    <div className="container py-10">
      <div className="card p-6">
        <div className="text-xl font-semibold tracking-tight">{title}</div>
        <div className="mt-2 text-sm text-[color:var(--muted)]">
          {visibility} · 创建于 {createdAt.toLocaleString()} · 更新于{" "}
          {updatedAt.toLocaleString()}
        </div>

        {tags.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs font-mono text-[color:var(--muted)]"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
          <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}

