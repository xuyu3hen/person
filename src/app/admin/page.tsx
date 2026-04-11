"use client";

import { useEffect, useMemo, useState } from "react";
import { DailyChart } from "@/components/DailyChart";

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

type Daily = {
  id: string;
  date: string;
  weight: number | null;
  masturbated: boolean;
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
  const [tab, setTab] = useState<"notes" | "plans" | "daily">("notes");

  const [notes, setNotes] = useState<Note[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [daily, setDaily] = useState<Daily | null>(null);
  const [dailyHistory, setDailyHistory] = useState<Daily[]>([]);

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
  const [noteSearch, setNoteSearch] = useState("");

  const filteredNotes = useMemo(() => {
    if (!noteSearch.trim()) return notes;
    const lower = noteSearch.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(lower) ||
        n.content.toLowerCase().includes(lower) ||
        n.tags.some((t) => t.toLowerCase().includes(lower))
    );
  }, [notes, noteSearch]);

  const [planStart, setPlanStart] = useState("09:00");
  const [planEnd, setPlanEnd] = useState("10:00");
  const [planTitle, setPlanTitle] = useState("");

  const [dailyDate, setDailyDate] = useState(todayYmd());
  const [dailyWeight, setDailyWeight] = useState("");
  const [dailyMasturbated, setDailyMasturbated] = useState(false);

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
    if (!authed) return;
    (async () => {
      setStatus("拉取记录...");
      try {
        const d = await api<Daily | null>(`/api/admin/dailies/?date=${dailyDate}`);
        setDaily(d);
        setStatus("已拉取");
      } catch (e: unknown) {
        setStatus(`拉取失败：${errorMessage(e)}`);
      }
    })();
  }, [dailyDate, authed]);

  useEffect(() => {
    if (daily) {
      setDailyWeight(daily.weight ? String(daily.weight) : "");
      setDailyMasturbated(daily.masturbated);
    } else {
      setDailyWeight("");
      setDailyMasturbated(false);
    }
  }, [daily]);

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
      const [ns, ps, d, dh] = await Promise.all([
        api<Note[]>("/api/admin/notes/"),
        api<Plan[]>("/api/admin/plans/today/"),
        api<Daily | null>(`/api/admin/dailies/?date=${dailyDate}`),
        api<Daily[]>(`/api/admin/dailies/?date=all`),
      ]);
      setNotes(ns);
      setPlans(ps);
      setDaily(d);
      setDailyHistory(dh);
      setStatus("已同步");
    } catch (e: unknown) {
      setStatus(`同步失败：${errorMessage(e)}`);
    }
  }

  async function onLogin() {
    setStatus("登录中…");
    try {
      await api("/api/admin/login/", {
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
      await api("/api/admin/logout/", { method: "POST" });
    } finally {
      setAuthed(false);
      setNotes([]);
      setPlans([]);
      setEditingId("");
      setViewingId("");
      setDaily(null);
      setDailyHistory([]);
      setStatus("已退出");
    }
  }

  async function saveNote() {
    if (isSavingNote) return;
    setIsSavingNote(true);
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
        await api(`/api/admin/notes/${encodeURIComponent(editingId)}/`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await api("/api/admin/notes/", {
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
    } finally {
      setIsSavingNote(false);
    }
  }

  async function deleteNote(id: string) {
    if (!confirm("确定删除这条笔记？")) return;
    setStatus("删除中…");
    try {
      await api(`/api/admin/notes/${encodeURIComponent(id)}/`, {
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
      await api("/api/admin/plans/", {
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
      await api(`/api/admin/plans/${encodeURIComponent(plan.id)}/`, {
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
      await api(`/api/admin/plans/${encodeURIComponent(id)}/`, {
        method: "DELETE",
      });
      await refreshAll();
      setStatus("已删除");
    } catch (e: unknown) {
      setStatus(`删除失败：${errorMessage(e)}`);
    }
  }

  const [isSavingDaily, setIsSavingDaily] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  async function saveDaily() {
    if (isSavingDaily) return;
    setIsSavingDaily(true);
    setStatus("保存中…");
    try {
      await api(`/api/admin/dailies/`, {
        method: "POST",
        body: JSON.stringify({
          date: dailyDate,
          weight: dailyWeight ? Number(dailyWeight) : null,
          masturbated: dailyMasturbated,
        }),
      });
      await refreshAll();
      setStatus(`${dailyDate} 数据已保存`);
    } catch (e: unknown) {
      setStatus(`保存失败：${errorMessage(e)}`);
    } finally {
      setIsSavingDaily(false);
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

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] items-start">
        <div className="card p-5 flex flex-col gap-4 sticky top-24">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold tracking-tight">导航</div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              className={`text-left px-4 py-3 rounded-xl transition-colors ${tab === "notes" ? "bg-[color:var(--accent)] text-white" : "hover:bg-[color:var(--panel)]"}`}
              onClick={() => setTab("notes")}
            >
              笔记
            </button>
            <button
              className={`text-left px-4 py-3 rounded-xl transition-colors ${tab === "plans" ? "bg-[color:var(--accent)] text-white" : "hover:bg-[color:var(--panel)]"}`}
              onClick={() => setTab("plans")}
            >
              今日计划
            </button>
            <button
              className={`text-left px-4 py-3 rounded-xl transition-colors ${tab === "daily" ? "bg-[color:var(--accent)] text-white" : "hover:bg-[color:var(--panel)]"}`}
              onClick={() => setTab("daily")}
            >
              每日记录
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-[color:var(--border)] text-sm text-[color:var(--muted)]">
            {status}
          </div>
        </div>

        {tab === "notes" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
            <div className="card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold tracking-tight">笔记列表</div>
                <div className="text-xs text-[color:var(--muted)]">
                  {filteredNotes.length} / {notes.length} 条
                </div>
              </div>
              <input
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 text-sm"
                placeholder="搜索笔记 (标题/内容/标签)..."
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
              />
              <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-2">
                {filteredNotes.length ? (
                  filteredNotes.map((n) => (
                    <div
                      key={n.id}
                      className={`card p-4 cursor-pointer border ${viewingId === n.id || editingId === n.id ? "border-[color:var(--accent)]" : "border-transparent"}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setEditingId("");
                        setViewingId(n.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
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
                        <div className="flex flex-col gap-2 whitespace-nowrap">
                          <button
                            className="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(n.id);
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

            {viewingNote ? (
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
                      }}
                    >
                      编辑
                    </button>
                    <button
                      className="button"
                      onClick={() => {
                        setEditingId("");
                        setNoteTitle("");
                        setNoteVisibility("public");
                        setNoteTags("");
                        setNoteContent("");
                        setViewingId("");
                      }}
                      disabled={isSavingNote}
                    >
                      新增文章
                    </button>
                    <button className="button" onClick={() => setViewingId("")} disabled={isSavingNote}>
                      关闭
                    </button>
                  </div>
                </div>
                <div className="sr-only">{viewingNote.title}</div>
                <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] p-4 max-h-[70vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-words text-[15px] leading-[1.7]">
                    {viewingNote.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="card p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-base font-semibold tracking-tight">
                    {editingId ? "编辑笔记" : noteVisibility === "public" ? "新建文章" : "新建笔记"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="button buttonPrimary"
                      onClick={saveNote}
                      disabled={isSavingNote}
                    >
                      {isSavingNote ? "保存中..." : "保存"}
                    </button>
                    {editingId && (
                      <button
                        className="button"
                        onClick={() => {
                          setEditingId("");
                          setNoteTitle("");
                          setNoteVisibility("private");
                          setNoteTags("");
                          setNoteContent("");
                        }}
                        disabled={isSavingNote}
                      >
                        取消编辑
                      </button>
                    )}
                  </div>
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

                <div className="flex flex-col gap-3 mt-3">
                  <textarea
                    className="w-full min-h-[400px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="内容（支持 Markdown 文本）…"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button className="button buttonPrimary" onClick={saveNote} disabled={isSavingNote}>
                    {isSavingNote ? "保存中..." : "保存"}
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
                    disabled={isSavingNote}
                  >
                    清空
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "plans" && (
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

        {tab === "daily" && (
          <div className="card p-6 flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-lg font-semibold tracking-tight">每日记录</div>
              <input
                type="date"
                max={todayYmd()}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 text-sm"
                value={dailyDate}
                onChange={(e) => {
                  if (e.target.value > todayYmd()) {
                    alert("不能录入未来日期的记录！");
                    return;
                  }
                  setDailyDate(e.target.value);
                }}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">体重 (kg)</label>
              <input
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                type="number"
                step="0.1"
                placeholder="例如：65.5"
                value={dailyWeight}
                onChange={(e) => setDailyWeight(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 mt-2">
              <input
                type="checkbox"
                id="masturbated-checkbox"
                className="w-5 h-5 rounded border-[color:var(--border)]"
                checked={dailyMasturbated}
                onChange={(e) => setDailyMasturbated(e.target.checked)}
              />
              <label htmlFor="masturbated-checkbox" className="text-sm font-medium cursor-pointer">
                今天撸管了吗？
              </label>
            </div>

            <div className="mt-4 flex gap-3">
              <button className="button buttonPrimary flex-1" onClick={saveDaily} disabled={isSavingDaily}>
                {isSavingDaily ? "保存中..." : `保存 ${dailyDate} 的记录`}
              </button>
            </div>

            <hr className="my-4 border-[color:var(--border)]" />
            <div className="text-md font-semibold tracking-tight">数据可视化</div>
            <div className="border border-[color:var(--border)] rounded-xl bg-[color:color-mix(in_srgb,var(--panel)_50%,transparent)] p-4">
              <DailyChart data={dailyHistory} />
            </div>

            <hr className="my-4 border-[color:var(--border)]" />
            <div className="text-md font-semibold tracking-tight">历史记录</div>
            <div className="flex flex-col gap-3">
              {dailyHistory.length > 0 ? (
                dailyHistory.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-4 border border-[color:var(--border)] rounded-xl bg-[color:color-mix(in_srgb,var(--panel)_50%,transparent)]">
                    <div className="font-mono text-sm">{h.date}</div>
                    <div className="text-sm font-medium flex gap-4">
                      <span>{h.weight !== null ? `${h.weight} kg` : "体重未记录"}</span>
                      <span>{h.masturbated ? "💦 已撸管" : "✨ 禁欲中"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-[color:var(--muted)]">暂无历史记录</div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
