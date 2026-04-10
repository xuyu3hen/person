import Link from "next/link";

import { ensureSchema, getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PostsPage() {
  await ensureSchema();
  const sql = getSql();
  const result = await sql`
    SELECT id, title, tags, created_at
    FROM journal_notes
    WHERE visibility = 'public'
    ORDER BY created_at DESC;
  `;

  const posts = result.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: String(row.id),
      title: String(row.title),
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      createdAt: new Date(String(row.created_at)),
    };
  });

  return (
    <div className="container py-10">
      <div className="text-xl font-semibold tracking-tight">文章</div>
      <div className="mt-2 text-sm text-[color:var(--muted)]">
        公开文章列表（从日记后台的 public 笔记生成）。
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {posts.length ? (
          posts.map((p) => (
            <Link
              key={p.id}
              href={`/posts/${p.id}`}
              className="card p-5 hover:bg-[color:color-mix(in_srgb,var(--panel)_85%,transparent)] transition-colors"
            >
              <div className="text-base font-semibold tracking-tight">
                {p.title}
              </div>
              <div className="mt-1 text-xs text-[color:var(--muted)]">
                {p.createdAt.toLocaleString()}
              </div>
              {p.tags.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] px-3 py-1 text-xs font-mono text-[color:var(--muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          ))
        ) : (
          <div className="text-sm text-[color:var(--muted)]">暂无文章</div>
        )}
      </div>
    </div>
  );
}

