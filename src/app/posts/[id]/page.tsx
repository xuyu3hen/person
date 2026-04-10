import { notFound } from "next/navigation";

import { ensureSchema, getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  await ensureSchema();
  const sql = getSql();
  const result = await sql`
    SELECT id, title, content, tags, created_at, updated_at
    FROM journal_notes
    WHERE id = ${id} AND visibility = 'public';
  `;

  if (!result.rows.length) notFound();

  const r = result.rows[0] as Record<string, unknown>;
  const title = String(r.title);
  const content = String(r.content);
  const tags = Array.isArray(r.tags) ? (r.tags as string[]) : [];
  const createdAt = new Date(String(r.created_at));
  const updatedAt = new Date(String(r.updated_at));

  return (
    <div className="container py-10">
      <div className="text-2xl font-semibold tracking-tight">{title}</div>
      <div className="mt-2 text-sm text-[color:var(--muted)]">
        发布于 {createdAt.toLocaleString()} · 更新于 {updatedAt.toLocaleString()}
      </div>
      {tags.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] px-3 py-1 text-xs font-mono text-[color:var(--muted)]"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-5">
        <pre className="whitespace-pre-wrap break-words text-[15px] leading-[1.7]">
          {content}
        </pre>
      </div>
    </div>
  );
}

