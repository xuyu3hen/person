"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Star, Trash2, Pencil } from "lucide-react";

export type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  rating: number;
  notes: string;
  status: "want" | "reading" | "finished" | "dropped";
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Unknown error";
}

const STATUS_LABELS: Record<string, string> = {
  want: "想读",
  reading: "在读",
  finished: "已读",
  dropped: "弃读",
};

const STATUS_COLORS: Record<string, string> = {
  want: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  reading: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  finished: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  dropped: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

function StarRating({ rating, onChange, interactive = false }: { rating: number; onChange?: (r: number) => void; interactive?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          onClick={() => onChange?.(star === rating ? star - 1 : star)}
          disabled={!interactive}
        >
          <Star
            size={16}
            className={
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-[color:var(--border)]"
            }
          />
        </button>
      ))}
    </div>
  );
}

export function BookNotesTab() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [bookStatus, setBookStatus] = useState<string>("reading");
  const [startedAt, setStartedAt] = useState("");
  const [finishedAt, setFinishedAt] = useState("");

  // Expanded view
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    if (filterStatus === "all") return books;
    return books.filter((b) => b.status === filterStatus);
  }, [books, filterStatus]);

  const stats = useMemo(() => ({
    total: books.length,
    reading: books.filter((b) => b.status === "reading").length,
    finished: books.filter((b) => b.status === "finished").length,
    want: books.filter((b) => b.status === "want").length,
  }), [books]);

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    setLoading(true);
    try {
      const data = await api<Book[]>("/api/admin/books/");
      setBooks(data);
    } catch (e) {
      setStatus(`加载失败：${errorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setIsbn("");
    setRating(0);
    setNotes("");
    setBookStatus("reading");
    setStartedAt("");
    setFinishedAt("");
  }

  function editBook(b: Book) {
    setEditingId(b.id);
    setTitle(b.title);
    setAuthor(b.author);
    setIsbn(b.isbn);
    setRating(b.rating);
    setNotes(b.notes);
    setBookStatus(b.status);
    setStartedAt(b.startedAt || "");
    setFinishedAt(b.finishedAt || "");
    setExpandedId(null);
  }

  async function saveBook() {
    if (!title.trim()) {
      setStatus("请填写书名");
      return;
    }

    setStatus("保存中...");
    try {
      const payload = {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        rating,
        notes: notes.trim(),
        status: bookStatus,
        startedAt: startedAt || null,
        finishedAt: finishedAt || null,
      };

      if (editingId) {
        await api(`/api/admin/books/${encodeURIComponent(editingId)}/`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setStatus("更新成功");
      } else {
        await api("/api/admin/books/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setStatus("添加成功");
      }
      resetForm();
      loadBooks();
    } catch (e) {
      setStatus(`保存失败：${errorMessage(e)}`);
    }
  }

  async function deleteBook(id: string) {
    if (!confirm("确定删除这本书的记录吗？")) return;
    setStatus("删除中...");
    try {
      await api(`/api/admin/books/${encodeURIComponent(id)}/`, {
        method: "DELETE",
      });
      setStatus("删除成功");
      if (expandedId === id) setExpandedId(null);
      loadBooks();
    } catch (e) {
      setStatus(`删除失败：${errorMessage(e)}`);
    }
  }

  async function quickChangeStatus(b: Book, newStatus: string) {
    try {
      await api(`/api/admin/books/${encodeURIComponent(b.id)}/`, {
        method: "PUT",
        body: JSON.stringify({
          ...b,
          status: newStatus,
          finishedAt: newStatus === "finished" && !b.finishedAt ? new Date().toISOString().slice(0, 10) : b.finishedAt,
        }),
      });
      loadBooks();
    } catch (e) {
      setStatus(`更新失败：${errorMessage(e)}`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[color:var(--accent)]" />
            <span className="font-semibold">读书笔记</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-[color:var(--muted)]">
            <span>共 <strong className="text-[color:var(--text)]">{stats.total}</strong> 本</span>
            <span className="text-blue-500">{stats.reading} 在读</span>
            <span className="text-green-500">{stats.finished} 已读</span>
            <span className="text-amber-500">{stats.want} 想读</span>
          </div>
        </div>
      </div>

      {/* Add / Edit Form */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight">
            {editingId ? "编辑读书笔记" : "添加新书"}
          </div>
          {editingId && (
            <button className="button text-xs" onClick={resetForm}>
              取消编辑
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">书名 *</label>
            <input
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
              placeholder="书名"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveBook(); }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">作者</label>
            <input
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
              placeholder="作者"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">ISBN</label>
            <input
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
              placeholder="ISBN（可选）"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">阅读状态</label>
            <select
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
              value={bookStatus}
              onChange={(e) => setBookStatus(e.target.value)}
            >
              <option value="want">想读</option>
              <option value="reading">在读</option>
              <option value="finished">已读</option>
              <option value="dropped">弃读</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">开始阅读日期</label>
            <input
              type="date"
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">完成日期</label>
            <input
              type="date"
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
              value={finishedAt}
              onChange={(e) => setFinishedAt(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">评分</label>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2">
              <StarRating rating={rating} onChange={setRating} interactive />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">读书笔记</label>
          <textarea
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 min-h-[200px]"
            placeholder="写点什么感想、摘抄、思考..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button className="button buttonPrimary px-8" onClick={saveBook}>
            {editingId ? "更新" : "添加"}
          </button>
          {status && <span className="text-sm text-[color:var(--muted)]">{status}</span>}
        </div>
      </div>

      {/* Book List */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight">书架</div>
          <div className="flex items-center gap-2">
            {["all", "reading", "finished", "want", "dropped"].map((s) => (
              <button
                key={s}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  filterStatus === s
                    ? "bg-[color:var(--accent)] text-white"
                    : "bg-[color:var(--panel)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
                }`}
                onClick={() => setFilterStatus(s)}
              >
                {s === "all" ? "全部" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-[color:var(--muted)] py-8 text-center">加载中...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-sm text-[color:var(--muted)] py-8 text-center">
            {filterStatus === "all" ? "书架空空如也，添加第一本书吧" : `没有"${STATUS_LABELS[filterStatus]}"的书`}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredBooks.map((b) => (
              <div
                key={b.id}
                className={`border rounded-xl p-4 transition-all hover:border-[color:var(--accent)] cursor-pointer ${
                  expandedId === b.id
                    ? "border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_5%,var(--panel))]"
                    : "border-[color:var(--border)] bg-[color:var(--panel)]"
                }`}
                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base truncate">{b.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </div>
                    {b.author && (
                      <div className="mt-1 text-sm text-[color:var(--muted)]">{b.author}</div>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-[color:var(--muted)]">
                      {b.rating > 0 && <StarRating rating={b.rating} />}
                      {b.startedAt && <span>开始: {b.startedAt}</span>}
                      {b.finishedAt && <span>完成: {b.finishedAt}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button className="button text-xs p-1.5" onClick={() => editBook(b)} title="编辑">
                      <Pencil size={14} />
                    </button>
                    <button className="button text-xs p-1.5 text-red-500" onClick={() => deleteBook(b.id)} title="删除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded Notes */}
                {expandedId === b.id && (
                  <div className="mt-4 pt-4 border-t border-[color:var(--border)]">
                    {b.notes ? (
                      <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[color:var(--text)]">
                        {b.notes}
                      </pre>
                    ) : (
                      <div className="text-sm text-[color:var(--muted)]">暂无笔记</div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-[color:var(--muted)]">快速切换状态:</span>
                      {(["want", "reading", "finished", "dropped"] as const).map((s) => (
                        <button
                          key={s}
                          className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                            b.status === s
                              ? STATUS_COLORS[s]
                              : "bg-[color:var(--panel)] text-[color:var(--muted)] hover:text-[color:var(--text)]"
                          }`}
                          onClick={() => quickChangeStatus(b, s)}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
