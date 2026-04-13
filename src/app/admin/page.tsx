"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { DailyChart } from "@/components/DailyChart";
import { BodyShapeTab } from "@/components/admin/BodyShapeTab";
import { PapersTab } from "@/components/admin/PapersTab";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  sortOrder: number;
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

type Paper = {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  pdfUrl: string | null;
  bibtex: string | null;
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

function SortablePlanItem({
  plan,
  updatePlan,
  deletePlan,
}: {
  plan: Plan;
  updatePlan: (plan: Plan, patch: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: plan.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="card p-4 relative group">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-[color:var(--muted)] hover:text-[color:var(--text)] p-2"
        title="拖拽排序"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
      </div>
      <div className="flex items-start justify-between gap-3 pl-6">
        <div className="flex items-start gap-3">
          <input
            className="mt-1"
            type="checkbox"
            checked={plan.done}
            onChange={(e) => updatePlan(plan, { done: e.target.checked })}
          />
          <div>
            <div className={`text-sm font-semibold tracking-tight ${plan.done ? 'line-through text-[color:var(--muted)]' : ''}`}>
              {plan.title}
            </div>
            <div className="mt-1 text-xs text-[color:var(--muted)]">
              {plan.startTime}
              {plan.endTime ? ` - ${plan.endTime}` : ""}
            </div>
          </div>
        </div>
        <button className="button" onClick={() => deletePlan(plan.id)}>
          删除
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[140px_140px_1fr_auto] pl-6">
        <input
          className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
          type="time"
          value={plan.startTime}
          onChange={(e) => updatePlan(plan, { startTime: e.target.value })}
        />
        <input
          className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
          type="time"
          value={plan.endTime}
          onChange={(e) => updatePlan(plan, { endTime: e.target.value })}
        />
        <input
          className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
          value={plan.title}
          onChange={(e) => updatePlan(plan, { title: e.target.value })}
        />
        <div className="text-xs text-[color:var(--muted)] self-center">
          {plan.done ? "已完成" : "进行中"}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [tab, setTab] = useState<"notes" | "plans" | "daily" | "bodyshape" | "papers">("notes");

  const [notes, setNotes] = useState<Note[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [daily, setDaily] = useState<Daily | null>(null);
  const [dailyHistory, setDailyHistory] = useState<Daily[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [papers, setPapers] = useState<Paper[]>([]);

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
  const [noteCreatedAt, setNoteCreatedAt] = useState("");
  const [noteView, setNoteView] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

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

  const [planStart, setPlanStart] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [planEnd, setPlanEnd] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    // Convert UTC created_at to local datetime-local format
    const d = new Date(editingNote.createdAt);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      setNoteCreatedAt(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
    } else {
      setNoteCreatedAt("");
    }
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
      const [ns, ps, d, dh, p] = await Promise.all([
        api<Note[]>("/api/admin/notes/"),
        api<Plan[]>("/api/admin/plans/today/"),
        api<Daily | null>(`/api/admin/dailies/?date=${dailyDate}`),
        api<Daily[]>(`/api/admin/dailies/?date=all`),
        api<Paper[]>("/api/admin/papers/"),
      ]);
      setNotes(ns);
      setPlans(ps);
      setDaily(d);
      setDailyHistory(dh);
      setPapers(p);
      setStatus("已同步");
    } catch (e: unknown) {
      setStatus(`同步失败：${errorMessage(e)}`);
    }
  }

  const notesByDate = useMemo(() => {
    const map: Record<string, Note[]> = {};
    notes.forEach((n) => {
      const d = format(parseISO(n.createdAt), "yyyy-MM-dd");
      if (!map[d]) map[d] = [];
      map[d].push(n);
    });
    return map;
  }, [notes]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth));
    const end = endOfWeek(endOfMonth(calendarMonth));
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

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
        createdAt: noteCreatedAt ? new Date(noteCreatedAt).toISOString() : undefined,
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
      setNoteCreatedAt("");
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
        setNoteCreatedAt("");
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
    
    // Optimistic UI update for 'done' status
    if ('done' in patch) {
      setPlans(prev => prev.map(p => p.id === plan.id ? next : p));
    }
    
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
      // If marked as done, also add it to daily history note or summary if needed
      // Currently, it stays in plans until next day. We refresh to keep in sync.
      await refreshAll();
      setStatus("已保存");
    } catch (e: unknown) {
      setStatus(`保存失败：${errorMessage(e)}`);
      await refreshAll(); // revert optimistic update on error
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Optimistically update order
      setPlans((prevPlans) => {
        const oldIndex = prevPlans.findIndex((i) => i.id === active.id);
        const newIndex = prevPlans.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(prevPlans, oldIndex, newIndex);
        
        const updates = newItems.map((item: Plan, index: number) => ({
          id: item.id,
          sortOrder: index,
        }));
        
        // Send bulk update to server
        api("/api/admin/plans/", {
          method: "POST",
          body: JSON.stringify(updates),
        }).catch((e) => {
          setStatus(`排序失败：${errorMessage(e)}`);
          refreshAll();
        });
        
        return newItems;
      });
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

  const [dailyViewMode, setDailyViewMode] = useState<"list" | "calendar">("list");

  function exportDailyMarkdown() {
    const lines = ["# 每日记录导出\n"];
    dailyHistory.forEach(h => {
      lines.push(`## ${h.date}`);
      lines.push(`- 体重: ${h.weight !== null ? h.weight + ' kg' : '未记录'}`);
      lines.push(`- 状态: ${h.masturbated ? '💦 已撸管' : '✨ 禁欲中'}`);
      lines.push("");
    });
    
    const blob = new Blob([lines.join("\n")], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-dailies-${todayYmd()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

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
    <div className="flex min-h-screen bg-[color:var(--bg)]">
      {/* Left Sidebar */}
      <aside className="fixed left-2 top-2 bottom-2 w-[240px] card p-5 flex flex-col gap-4 overflow-y-auto z-20 shadow-lg">
        <div className="flex items-center justify-between mb-2">
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
          <button
            className={`text-left px-4 py-3 rounded-xl transition-colors ${tab === "bodyshape" ? "bg-[color:var(--accent)] text-white" : "hover:bg-[color:var(--panel)]"}`}
            onClick={() => setTab("bodyshape")}
          >
            体型记录
          </button>
          <button
            className={`text-left px-4 py-3 rounded-xl transition-colors ${tab === "papers" ? "bg-[color:var(--accent)] text-white" : "hover:bg-[color:var(--panel)]"}`}
            onClick={() => setTab("papers")}
          >
            论文管理
          </button>
        </div>
        <div className="mt-auto pt-4 border-t border-[color:var(--border)] flex flex-col gap-3">
          <div className="text-sm text-[color:var(--muted)]">
            {status}
          </div>
          <button className="button w-full" onClick={refreshAll}>
            同步数据
          </button>
          <button className="button w-full" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[256px] p-6 max-w-6xl">

        {tab === "notes" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
            <div className="card p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold tracking-tight">笔记列表</div>
                <div className="flex items-center gap-2">
                  <button
                    className={`text-xs px-2 py-1 rounded ${noteView === "list" ? "bg-[color:var(--accent)] text-white" : "bg-[color:var(--panel)]"}`}
                    onClick={() => setNoteView("list")}
                  >
                    列表
                  </button>
                  <button
                    className={`text-xs px-2 py-1 rounded ${noteView === "calendar" ? "bg-[color:var(--accent)] text-white" : "bg-[color:var(--panel)]"}`}
                    onClick={() => setNoteView("calendar")}
                  >
                    日历
                  </button>
                </div>
              </div>
              
              {noteView === "list" ? (
                <>
                  <input
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 text-sm"
                    placeholder="搜索笔记 (标题/内容/标签)..."
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                  />
                  <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
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
                </>
              ) : (
                <div className="flex flex-col flex-1 h-[70vh] overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      className="button px-2"
                      onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                    >
                      &lt;
                    </button>
                    <div className="text-sm font-semibold text-center">
                      {format(calendarMonth, "yyyy年MM月")}
                    </div>
                    <button
                      className="button px-2"
                      onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                    >
                      &gt;
                    </button>
                  </div>
      
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[color:var(--muted)] mb-2">
                    {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>
      
                  <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr overflow-y-auto no-scrollbar">
                    {calendarDays.map((day) => {
                      const dStr = format(day, "yyyy-MM-dd");
                      const dayNotes = notesByDate[dStr] || [];
                      const isCurMonth = isSameMonth(day, calendarMonth);
                      const isTodayDay = isToday(day);
      
                      return (
                        <div
                          key={dStr}
                          className={`border rounded p-1 flex flex-col overflow-hidden cursor-pointer transition-colors ${
                            isCurMonth
                              ? "border-[color:var(--border)] bg-[color:var(--panel)] hover:bg-[color:color-mix(in_srgb,var(--panel)_80%,transparent)]"
                              : "border-transparent opacity-40"
                          } ${isTodayDay ? "ring-1 ring-[color:var(--accent)]" : ""}`}
                          onClick={() => {
                            const now = new Date();
                            day.setHours(now.getHours(), now.getMinutes());
                            setNoteCreatedAt(format(day, "yyyy-MM-dd'T'HH:mm"));
                            setEditingId("");
                            setNoteTitle("");
                            setNoteContent("");
                            setNoteTags("");
                            setNoteVisibility("private");
                            setViewingId("");
                          }}
                        >
                          <div
                            className={`text-right text-[10px] mb-1 ${
                              isTodayDay ? "text-[color:var(--accent)] font-bold" : ""
                            }`}
                          >
                            {format(day, "d")}
                          </div>
                          <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar">
                            {dayNotes.map((n) => (
                              <div
                                key={n.id}
                                className="text-[10px] truncate rounded bg-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] px-1 py-0.5 text-[color:var(--accent)]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingId(n.id);
                                  setEditingId("");
                                }}
                                title={n.title}
                              >
                                {n.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                        setNoteCreatedAt("");
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
                          setNoteCreatedAt("");
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

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
                  <input
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="标题"
                    disabled={isSavingNote}
                  />
                  <input
                    type="datetime-local"
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm min-w-[200px]"
                    value={noteCreatedAt}
                    onChange={(e) => setNoteCreatedAt(e.target.value)}
                    disabled={isSavingNote}
                  />
                  <select
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                    value={noteVisibility}
                    onChange={(e) =>
                      setNoteVisibility(e.target.value as NoteVisibility)
                    }
                    disabled={isSavingNote}
                  >
                    <option value="private">私有</option>
                    <option value="public">可展示</option>
                </select>
                <input
                  className="md:col-span-3 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
                  value={noteTags}
                  onChange={(e) => setNoteTags(e.target.value)}
                  placeholder="标签（逗号分隔）"
                  disabled={isSavingNote}
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
                      setNoteCreatedAt("");
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

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={plans.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="mt-5 flex flex-col gap-2">
                  {plans.length ? (
                    plans.map((p) => (
                      <SortablePlanItem key={p.id} plan={p} updatePlan={updatePlan} deletePlan={deletePlan} />
                    ))
                  ) : (
                    <div className="text-sm text-[color:var(--muted)]">
                      今天还没有计划。
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
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
            <div className="flex items-center justify-between">
              <div className="text-md font-semibold tracking-tight">历史记录</div>
              <div className="flex items-center gap-2">
                <button 
                  className={`text-xs px-2 py-1 rounded transition-colors ${dailyViewMode === "list" ? "bg-[color:var(--accent)] text-white" : "bg-[color:var(--panel)] text-[color:var(--muted)]"}`}
                  onClick={() => setDailyViewMode("list")}
                >
                  列表
                </button>
                <button 
                  className={`text-xs px-2 py-1 rounded transition-colors ${dailyViewMode === "calendar" ? "bg-[color:var(--accent)] text-white" : "bg-[color:var(--panel)] text-[color:var(--muted)]"}`}
                  onClick={() => setDailyViewMode("calendar")}
                >
                  日历
                </button>
                <button 
                  className="text-xs px-2 py-1 rounded bg-[color:var(--panel)] text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors border border-[color:var(--border)] ml-2"
                  onClick={exportDailyMarkdown}
                  title="导出为 Markdown"
                >
                  ↓ 导出 MD
                </button>
              </div>
            </div>
            
            {dailyViewMode === "list" ? (
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
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {["日", "一", "二", "三", "四", "五", "六"].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-[color:var(--muted)] pb-2">{day}</div>
                ))}
                {/* 简易日历视图，仅填充最近记录的占位格 */}
                {Array.from({ length: new Date(dailyDate).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2 opacity-0" />
                ))}
                {dailyHistory.slice(0, 31).reverse().map((h) => (
                  <div 
                    key={h.id} 
                    title={`${h.date}\n体重: ${h.weight || '-'}\n状态: ${h.masturbated ? '已撸管' : '禁欲中'}`}
                    onClick={() => setDailyDate(h.date)}
                    className={`aspect-square rounded-lg border p-1 flex flex-col items-center justify-center cursor-pointer transition-colors text-xs
                      ${h.date === dailyDate ? 'border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'border-[color:var(--border)] bg-[color:var(--panel)] hover:bg-[color:color-mix(in_srgb,var(--panel)_80%,transparent)]'}
                    `}
                  >
                    <span className="font-mono opacity-60 mb-1">{h.date.slice(8, 10)}</span>
                    <span>{h.masturbated ? "💦" : "✨"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "bodyshape" && <BodyShapeTab />}
        {tab === "papers" && <PapersTab />}
      </main>
    </div>
  );
}
