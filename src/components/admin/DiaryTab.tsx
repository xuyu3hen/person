"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

type DiaryEntry = {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  weather: string;
  tags: string[];
  photos: string[];
  createdAt: string;
  updatedAt: string;
};

const MOODS: { value: string; emoji: string; label: string }[] = [
  { value: "happy", emoji: "😊", label: "开心" },
  { value: "sad", emoji: "😢", label: "难过" },
  { value: "productive", emoji: "⚡", label: "高效" },
  { value: "inspired", emoji: "💡", label: "灵感" },
  { value: "relaxed", emoji: "🌿", label: "放松" },
  { value: "accomplished", emoji: "🎯", label: "成就" },
  { value: "learning", emoji: "📚", label: "学习" },
  { value: "tired", emoji: "😴", label: "疲惫" },
  { value: "angry", emoji: "😡", label: "生气" },
  { value: "anxious", emoji: "😰", label: "焦虑" },
];

const WEATHERS: { value: string; emoji: string; label: string }[] = [
  { value: "sunny", emoji: "☀️", label: "晴" },
  { value: "cloudy", emoji: "⛅", label: "多云" },
  { value: "rainy", emoji: "🌧", label: "雨" },
  { value: "stormy", emoji: "⛈", label: "雷雨" },
  { value: "snowy", emoji: "❄️", label: "雪" },
  { value: "windy", emoji: "🌬", label: "风" },
];

function getMoodInfo(value: string) {
  return MOODS.find((m) => m.value === value);
}

function getWeatherInfo(value: string) {
  return WEATHERS.find((w) => w.value === value);
}

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

export function DiaryTab() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string>("");
  const editingEntry = useMemo(
    () => entries.find((e) => e.id === editingId) ?? null,
    [editingId, entries]
  );

  const [date, setDate] = useState(todayYmd());
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("");
  const [weather, setWeather] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  async function refresh() {
    try {
      const data = await api<DiaryEntry[]>("/api/admin/diary/");
      setEntries(data);
      setStatus("");
    } catch (e: unknown) {
      setStatus(`加载失败：${errorMessage(e)}`);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!editingEntry) return;
    setDate(editingEntry.date);
    setTitle(editingEntry.title);
    setMood(editingEntry.mood);
    setWeather(editingEntry.weather);
    setTags(editingEntry.tags.join(", "));
    setContent(editingEntry.content);
    setPhotos(editingEntry.photos || []);
  }, [editingEntry]);

  function resetForm() {
    setEditingId("");
    setDate(todayYmd());
    setTitle("");
    setMood("");
    setWeather("");
    setTags("");
    setContent("");
    setPhotos([]);
  }

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const lower = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(lower) ||
        e.content.toLowerCase().includes(lower) ||
        e.tags.some((t) => t.toLowerCase().includes(lower))
    );
  }, [entries, search]);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      setStatus(`最多只能上传 ${MAX_PHOTOS} 张照片`);
      return;
    }

    setIsUploadingPhoto(true);
    setStatus("上传照片中…");

    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_PHOTO_SIZE) {
        setStatus(`照片 ${file.name} 超过 5MB 限制`);
        continue;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "上传失败");
        uploaded.push(data.url as string);
      } catch (err: unknown) {
        setStatus(`上传失败：${errorMessage(err)}`);
      }
    }

    if (uploaded.length > 0) {
      setPhotos((prev) => [...prev, ...uploaded].slice(0, MAX_PHOTOS));
      setStatus("照片已上传");
    }
    setIsUploadingPhoto(false);
    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    if (isSaving) return;
    if (!title.trim() || !content.trim()) {
      setStatus("标题和内容不能为空");
      return;
    }
    setIsSaving(true);
    setStatus("保存中…");
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        date,
        mood,
        weather,
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        photos,
      };
      if (editingId) {
        await api(`/api/admin/diary/${encodeURIComponent(editingId)}/`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/admin/diary/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await refresh();
      setStatus("已保存");
    } catch (e: unknown) {
      setStatus(`保存失败：${errorMessage(e)}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm("确定删除这篇日记？")) return;
    setStatus("删除中…");
    try {
      await api(`/api/admin/diary/${encodeURIComponent(id)}/`, {
        method: "DELETE",
      });
      if (editingId === id) resetForm();
      await refresh();
      setStatus("已删除");
    } catch (e: unknown) {
      setStatus(`删除失败：${errorMessage(e)}`);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
      {/* Left: Entry List */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="text-base font-semibold tracking-tight">日记列表</div>

        <input
          className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 text-sm"
          placeholder="搜索日记 (标题/内容/标签)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
          {filteredEntries.length ? (
            filteredEntries.map((e) => {
              const moodInfo = getMoodInfo(e.mood);
              const weatherInfo = getWeatherInfo(e.weather);
              return (
                <div
                  key={e.id}
                  className={`card p-4 cursor-pointer border ${
                    editingId === e.id
                      ? "border-[color:var(--accent)]"
                      : "border-transparent"
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingId(e.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      setEditingId(e.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-[color:var(--muted)]">
                          {e.date}
                        </span>
                        {moodInfo && (
                          <span title={moodInfo.label}>
                            {moodInfo.emoji}
                          </span>
                        )}
                        {weatherInfo && (
                          <span title={weatherInfo.label}>
                            {weatherInfo.emoji}
                          </span>
                        )}
                        {e.photos && e.photos.length > 0 && (
                          <span className="text-xs" title={`${e.photos.length} 张照片`}>
                            📷{e.photos.length}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold tracking-tight mt-1 truncate">
                        {e.title}
                      </div>
                      <div className="mt-1 text-xs text-[color:var(--muted)] line-clamp-2">
                        {e.content}
                      </div>
                      {e.tags.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {e.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] px-2 py-0.5 text-xs font-mono text-[color:var(--muted)]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        className="button text-xs"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setEditingId(e.id);
                        }}
                      >
                        编辑
                      </button>
                      <button
                        className="button text-xs"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          deleteEntry(e.id);
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-[color:var(--muted)]">
              {search ? "没有匹配的日记" : "暂无日记，在右侧新建一篇吧 ✍️"}
            </div>
          )}
        </div>

        {status && (
          <div className="text-xs text-[color:var(--muted)]">{status}</div>
        )}
      </div>

      {/* Right: Edit Form */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-base font-semibold tracking-tight">
            {editingId ? "编辑日记" : "新建日记"}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="button buttonPrimary"
              onClick={save}
              disabled={isSaving}
            >
              {isSaving ? "保存中..." : "保存"}
            </button>
            {editingId && (
              <button className="button" onClick={resetForm} disabled={isSaving}>
                取消编辑
              </button>
            )}
          </div>
        </div>

        {editingEntry && (
          <div className="mt-2 text-xs text-[color:var(--muted)]">
            创建于 {new Date(editingEntry.createdAt).toLocaleString()} · 更新于{" "}
            {new Date(editingEntry.updatedAt).toLocaleString()}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题"
            disabled={isSaving}
          />
          <input
            type="date"
            max={todayYmd()}
            className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSaving}
          />
        </div>

        {/* Mood Selector */}
        <div className="mt-4">
          <div className="text-xs font-medium text-[color:var(--muted)] mb-2">
            心情
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                  mood === m.value
                    ? "bg-[color:var(--accent)] text-white ring-2 ring-[color:var(--accent)] ring-offset-1"
                    : "bg-[color:var(--panel)] border border-[color:var(--border)] hover:border-[color:var(--accent)]"
                }`}
                onClick={() => setMood(mood === m.value ? "" : m.value)}
                disabled={isSaving}
                title={m.label}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Weather Selector */}
        <div className="mt-4">
          <div className="text-xs font-medium text-[color:var(--muted)] mb-2">
            天气
          </div>
          <div className="flex flex-wrap gap-2">
            {WEATHERS.map((w) => (
              <button
                key={w.value}
                type="button"
                className={`rounded-full px-3 py-1.5 text-sm transition-all ${
                  weather === w.value
                    ? "bg-[color:var(--accent)] text-white ring-2 ring-[color:var(--accent)] ring-offset-1"
                    : "bg-[color:var(--panel)] border border-[color:var(--border)] hover:border-[color:var(--accent)]"
                }`}
                onClick={() =>
                  setWeather(weather === w.value ? "" : w.value)
                }
                disabled={isSaving}
                title={w.label}
              >
                {w.emoji} {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <input
            className="w-full rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3 text-sm"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="标签（逗号分隔）"
            disabled={isSaving}
          />
        </div>

        {/* Photos */}
        <div className="mt-4">
          <div className="text-xs font-medium text-[color:var(--muted)] mb-2">
            照片 ({photos.length}/{MAX_PHOTOS})
          </div>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {photos.map((url, i) => (
                <div key={i} className="relative group">
                  <img
                    src={url}
                    alt={`照片 ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-xl border border-[color:var(--border)]"
                  />
                  <button
                    type="button"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(i)}
                    disabled={isSaving}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoSelect}
              disabled={isSaving || isUploadingPhoto || photos.length >= MAX_PHOTOS}
            />
            <button
              type="button"
              className="button text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving || isUploadingPhoto || photos.length >= MAX_PHOTOS}
            >
              {isUploadingPhoto ? "上传中..." : "选择照片"}
            </button>
            <span className="text-[10px] text-[color:var(--muted)]">
              每张 ≤ 5MB，存储在 Vercel Blob
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          <textarea
            className="w-full min-h-[350px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="日记内容（支持 Markdown 文本）…"
            disabled={isSaving}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            className="button buttonPrimary"
            onClick={save}
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
          <button
            className="button"
            onClick={resetForm}
            disabled={isSaving}
          >
            清空
          </button>
        </div>
      </div>
    </div>
  );
}
