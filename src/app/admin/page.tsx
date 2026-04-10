"use client";

import { useEffect, useMemo, useState } from "react";

type NoteVisibility = "private" | "public";

type Note = {
  id: string;
  title: string;
  content: string;
  visibility: NoteVisibility;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type Plan = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  done: boolean;
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

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [tab, setTab] = useState<"notes" | "plans">("notes");

  const [notes, setNotes] = useState<Note[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [loginPassword, setLoginPassword] = useState("");

  const [editingId, setEditingId] = useState<string>("");
  const [viewingId, setViewingId] = useState<string>("");
  const editingNote = useMemo(
    () => notes.find((n) => n.id === editingId) ?? null,
    [editingId, notes]
  );
  const viewingNote = useMemo(
    () => notes.find((n) => n.id === viewingId) ?? null,
    [viewingId, notes]
  );

  const [noteTitle, setNoteTitle] = useState("");
  const [noteVisibility, setNoteVisibility] = useState<NoteVisibility>(
    "private"
  );
  const [noteTags, setNoteTags] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const [planStart, setPlanStart] = useState("09:00");
  const [planEnd, setPlanEnd] = useState("10:00");
  const [planTitle, setPlanTitle] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await api<{ ok: boolean }>("/api/admin/session");
        setAuthed(r.ok);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!authed) return;
    refreshAll();
  }, [authed]);

  useEffect(() => {
    if (!editingNote) return;
    setNoteTitle(editingNote.title);
    setNoteVisibility(editingNote.visibility);
    setNoteTags(editingNote.tags.join(", "));
    setNoteContent(editingNote.content);
  }, [editingNote]);

  useEffect(() => {
    if (!viewingId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingId("");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewingId]);

  async function refreshAll() {
    setStatus("同步中…");
    try {
      const [ns, ps] = await Promise.all([
        api<Note[]>("/api/admin/notes"),
        api<Plan[]>("/api/admin/plans/today"),
      ]);
      setNotes(ns);
      setPlans(ps);
      setStatus("已同步");
    } catch (e: unknown) {
      setStatus(`同步失败：${errorMessage(e)}`);
    }
  }

  async function onLogin() {
    setStatus("登录中…");
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: loginPassword }),
      });
      setAuthed(true);
      setLoginPassword("");
      setStatus("登录成功");
    } catch (e: unknown) {
      setStatus(`登录失败：${errorMessage(e)}`);
    }
  }

  async function onLogout() {
    try {
      await api("/api/admin/logout", { method: "POST" });
    } finally {
      setAuthed(false);
      setNotes([]);
      setPlans([]);
      setEditingId("");
      setViewingId("");
      setStatus("已退出");
    }
  }

  async function saveNote() {
    setStatus("保存中…");
    try {
      const payload = {
        title: noteTitle,
        content: noteContent,
        visibility: noteVisibility,
        tags: noteTags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editingId) {
        await api(`/api/admin/notes/${encodeURIComponent(editingId)}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await api("/api/admin/notes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditingId("");
      setNoteTitle("");
      setNoteVisibility("private");
      setNoteTags("");
      setNoteContent("");
      await refreshAll();
      setStatus("已保存");
    } catch (e: unknown) {
      setStatus(`保存失败：${errorMessage(e)}`);
    }
  }

  async function deleteNote(id: string) {
    if (!confirm("确定删除这条笔记？")) return;
    setStatus("删除中…");
    try {
      await api(`/api/admin/notes/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (editingId === id) {
        setEditingId("");
        setNoteTitle("");
        setNoteVisibility("private");
        setNoteTags("");
        setNoteContent("");
      }
      if (viewingId === id) {
        setViewingId("");
      }
      await refreshAll();
      setStatus("已删除");
    } catch (e: unknown) {
      setStatus(`删除失败：${errorMessage(e)}`);
    }
  }

  async function addPlan() {
    setStatus("保存中…");
    try {
      await api("/api/admin/plans", {
        method: "POST",
        body: JSON.stringify({
          date: todayYmd(),
          startTime: planStart,
          endTime: planEnd,
          title: planTitle,
          done: false,
        }),
      });
      setPlanTitle("");
      await refreshAll();
      setStatus("已保存");
    } catch (e: unknown) {
      setStatus(`保存失败：${errorMessage(e)}`);
    }
  }

  async function updatePlan(plan: Plan, patch: Partial<Plan>) {
    const next = { ...plan, ...patch };
    setStatus("保存中…");
    try {
      await api(`/api/admin/plans/${encodeURIComponent(plan.id)}`, {
        method: "PUT",
        body: JSON.stringify({
          date: next.date,
          startTime: next.startTime,
          endTime: next.endTime,
          title: next.title,
          done: next.done,
        }),
      });
      await refreshAll();
      setStatus("已保存");
    } catch (e: unknown) {
      setStatus(`保存失败：${errorMessage(e)}`);
    }
  }

  async function deletePlan(id: string) {
    if (!confirm("确定删除这条计划？")) return;
    setStatus("删除中…");
    try {
      await api(`/api/admin/plans/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await refreshAll();
      setStatus("已删除");
    } catch (e: unknown) {
      setStatus(`删除失败：${errorMessage(e)}`);
    }
  }

  if (checking) {
    return (
      <div className="container py-16">
        <div className="card p-6">加载中…</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="container py-16">
        <div className="card p-6 max-w-xl">
          <div className="text-lg font-semibold tracking-tight">日记后台</div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">
            请输入后台密码（环境变量 `ADMIN_PASSWORD`）。
          </div>
          <div className="mt-6 flex gap-3">
            <input
              className="flex-1 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="后台密码"
              onKeyDown={(e) => {
                if (e.key === "Enter") onLogin();
              }}
            />
            <button className="button buttonPrimary" onClick={onLogin}>
              登录
            </button>
          </div>
          {status ? (
            <div className="mt-4 text-sm text-[color:var(--muted)]">
              {status}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold tracking-tight">Journal Admin</div>
          <div className="mt-1 text-sm text-[color:var(--muted)]">
            同域名 `/admin` · 笔记（私有/可展示）· 今日工作计划
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="button" onClick={refreshAll}>
            同步
          </button>
          <button className="button" onClick={onLogout}>
            退出
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          className={
            "button " +
            (tab === "notes"
              ? "buttonPrimary"
              : "")
          }
          onClick={() => setTab("notes")}
        >
          笔记
        </button>
        <button
          className={
            "button " +
            (tab === "plans"
              ? "buttonPrimary"
              : "")
          }
          onClick={() => setTab("plans")}
        >
          今日计划
        </button>
        <div className="flex-1" />
        <div className="text-sm text-[color:var(--muted)] self-center">
          {status}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold tracking-tight">笔记列表</div>
            <div className="text-xs text-[color:var(--muted)]">
              {notes.length} 条
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {notes.length ? (
              notes.map((n) => (
                <div
                  key={n.id}
                  className="card p-4 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setTab("notes");
                    setEditingId("");
                    setViewingId(n.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setTab("notes");
                      setEditingId("");
                      setViewingId(n.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold tracking-tight">
                        {n.title}
                      </div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        {n.visibility} · {new Date(n.createdAt).toLocaleString()}
                      </div>
                      {n.tags.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {n.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] px-3 py-1 text-xs font-mono text-[color:var(--muted)]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-row gap-2 whitespace-nowrap">
                      <button
                        className="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(n.id);
                          setTab("notes");
                          setViewingId("");
                        }}
                      >
                        编辑
                      </button>
                      <button
                        className="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(n.id);
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-[color:var(--muted)]">暂无笔记</div>
            )}
          </div>
        </div>

        {tab === "notes" ? (
          viewingNote ? (
            <div className="card p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-base font-semibold tracking-tight">
                  查看笔记
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="button"
                    onClick={() => {
                      setEditingId(viewingNote.id);
                      setViewingId("");
                      setTab("notes");
                    }}
                  >
                    编辑
                  </button>
                  <button className="button" onClick={() => setViewingId("")}>
                    关闭
                  </button>
                </div>
              </div>
              <div className="sr-only">{viewingNote.title}</div>
              <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4">
                <pre className="whitespace-pre-wrap break-words text-[15px] leading-[1.7]">
                  {viewingNote.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="card p-5">
              <div className="text-base font-semibold tracking-tight">
                {editingId ? "编辑笔记" : "新建笔记"}
              </div>
              {editingNote ? (
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  创建于 {new Date(editingNote.createdAt).toLocaleString()} · 更新于{" "}
                  {new Date(editingNote.updatedAt).toLocaleString()}
                </div>
              ) : (
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  选择私有或可展示（public）。
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="标题"
                />
                <select
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                  value={noteVisibility}
                  onChange={(e) =>
                    setNoteVisibility(e.target.value as NoteVisibility)
                  }
                >
                  <option value="private">私有</option>
                  <option value="public">可展示</option>
                </select>
                <input
                  className="md:col-span-2 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  placeholder="标签（逗号分隔）"
                />
              </div>

              <textarea
                className="mt-3 w-full min-h-[280px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="内容（支持 Markdown 文本）…"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button className="button buttonPrimary" onClick={saveNote}>
                  保存
                </button>
                <button
                  className="button"
                  onClick={() => {
                    setEditingId("");
                    setNoteTitle("");
                    setNoteVisibility("private");
                    setNoteTags("");
                    setNoteContent("");
                  }}
                >
                  清空
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="card p-5">
            <div className="text-base font-semibold tracking-tight">
              今日工作计划
            </div>
            <div className="mt-2 text-xs text-[color:var(--muted)]">
              可规定时间段，勾选完成。
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[140px_140px_1fr_auto]">
              <input
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                type="time"
                value={planStart}
                onChange={(e) => setPlanStart(e.target.value)}
              />
              <input
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                type="time"
                value={planEnd}
                onChange={(e) => setPlanEnd(e.target.value)}
              />
              <input
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                placeholder="计划事项"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addPlan();
                }}
              />
              <button className="button buttonPrimary" onClick={addPlan}>
                添加
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {plans.length ? (
                plans.map((p) => (
                  <div key={p.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          className="mt-1"
                          type="checkbox"
                          checked={p.done}
                          onChange={(e) =>
                            updatePlan(p, { done: e.target.checked })
                          }
                        />
                        <div>
                          <div className="text-sm font-semibold tracking-tight">
                            {p.title}
                          </div>
                          <div className="mt-1 text-xs text-[color:var(--muted)]">
                            {p.startTime}
                            {p.endTime ? ` - ${p.endTime}` : ""}
                          </div>
                        </div>
                      </div>
                      <button className="button" onClick={() => deletePlan(p.id)}>
                        删除
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[140px_140px_1fr_auto]">
                      <input
                        className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
                        type="time"
                        value={p.startTime}
                        onChange={(e) =>
                          updatePlan(p, { startTime: e.target.value })
                        }
                      />
                      <input
                        className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
                        type="time"
                        value={p.endTime}
                        onChange={(e) =>
                          updatePlan(p, { endTime: e.target.value })
                        }
                      />
                      <input
                        className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
                        value={p.title}
                        onChange={(e) =>
                          updatePlan(p, { title: e.target.value })
                        }
                      />
                      <div className="text-xs text-[color:var(--muted)] self-center">
                        {p.done ? "已完成" : "进行中"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-[color:var(--muted)]">
                  今天还没有计划。
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
