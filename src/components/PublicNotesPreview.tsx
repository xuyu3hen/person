import Link from "next/link";
import { ChevronRight, PenSquare } from "lucide-react";

import { SectionHeader } from "./SectionHeader";

type PublicNote = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  createdAt: string;
};

export function PublicNotesPreview({ notes }: { notes?: PublicNote[] }) {
  const items = notes ?? [];

  return (
    <section id="notes-preview" className="section">
      <div className="container py-14">
        <SectionHeader
          eyebrow="Public Notes"
          title="公开笔记"
          description="前台文章卡片直接读取后台设置为 public 的内容，你在后台发布后，这里会自动更新。"
        />

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {items.length > 0 ? (
            items.map((note) => (
              <Link
                key={note.id}
                href={`/posts/${note.id}`}
                className="card group relative overflow-hidden p-6 transition-transform hover:-translate-y-0.5"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_55%,transparent),transparent)] opacity-70"
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-3 text-lg font-semibold tracking-tight">
                      {note.title}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                      {note.summary}
                    </p>
                    {note.tags.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {note.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_100%,transparent)] px-3 py-1 text-xs font-mono text-[color:var(--muted)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--accent)_25%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] p-3">
                    <PenSquare size={16} className="text-[color:var(--accent)]" />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="panelInset rounded-[22px] px-5 py-5 text-sm text-[color:var(--muted)]">
              暂无公开笔记，去后台把重要内容设为 `public` 后，这里会自动出现。
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <Link
            href="/posts"
            className="button"
          >
            <span className="text-sm">查看全部文章</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
