"use client";

import { useEffect, useState } from "react";

export type Paper = {
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

export function PapersTab() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  
  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [journal, setJournal] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [bibtex, setBibtex] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPapers();
  }, []);

  async function loadPapers() {
    setLoading(true);
    try {
      const data = await api<Paper[]>("/api/admin/papers/");
      setPapers(data);
    } catch (e) {
      setStatus(`加载失败：${errorMessage(e)}`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setAuthors("");
    setYear(new Date().getFullYear());
    setJournal("");
    setPdfUrl("");
    setBibtex("");
  }

  function editPaper(p: Paper) {
    setEditingId(p.id);
    setTitle(p.title);
    setAuthors(p.authors);
    setYear(p.year);
    setJournal(p.journal);
    setPdfUrl(p.pdfUrl || "");
    setBibtex(p.bibtex || "");
  }

  async function savePaper() {
    if (!title.trim() || !authors.trim() || !journal.trim()) {
      setStatus("请填写标题、作者和发表期刊");
      return;
    }
    
    setStatus("保存中...");
    try {
      if (editingId) {
        await api(`/api/admin/papers/${encodeURIComponent(editingId)}/`, {
          method: "PUT",
          body: JSON.stringify({
            title,
            authors,
            year,
            journal,
            pdfUrl: pdfUrl || null,
            bibtex: bibtex || null,
          }),
        });
        setStatus("更新成功");
      } else {
        await api("/api/admin/papers/", {
          method: "POST",
          body: JSON.stringify({
            title,
            authors,
            year,
            journal,
            pdfUrl: pdfUrl || null,
            bibtex: bibtex || null,
          }),
        });
        setStatus("添加成功");
      }
      resetForm();
      loadPapers();
    } catch (e) {
      setStatus(`保存失败：${errorMessage(e)}`);
    }
  }

  async function deletePaper(id: string) {
    if (!confirm("确定删除这篇论文吗？")) return;
    setStatus("删除中...");
    try {
      await api(`/api/admin/papers/${encodeURIComponent(id)}/`, {
        method: "DELETE",
      });
      setStatus("删除成功");
      loadPapers();
    } catch (e) {
      setStatus(`删除失败：${errorMessage(e)}`);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setStatus("只能上传 PDF 文件");
      return;
    }

    setUploading(true);
    setStatus("上传中...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      setPdfUrl(data.url);
      setStatus("上传成功");
    } catch (err) {
      setStatus(`上传失败：${errorMessage(err)}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6 flex flex-col gap-4">
        <div className="text-lg font-semibold tracking-tight">
          {editingId ? "编辑论文" : "添加论文"}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">标题 *</label>
            <input
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
              placeholder="论文标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">作者 *</label>
            <input
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
              placeholder="例如: Yuchen Xu, John Doe"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">发表期刊/会议 *</label>
            <input
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
              placeholder="例如: CVPR 2026"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">年份 *</label>
            <input
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium">PDF 链接 / 上传 PDF</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2"
                placeholder="可以直接输入外部 URL 或上传本地文件"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
              />
              <label className="button buttonPrimary cursor-pointer flex items-center justify-center min-w-[100px]">
                {uploading ? "上传中..." : "上传 PDF"}
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium">BibTeX (可选)</label>
            <textarea
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 h-24 font-mono text-sm"
              placeholder="@article{..."
              value={bibtex}
              onChange={(e) => setBibtex(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <button className="button buttonPrimary px-8" onClick={savePaper}>
            {editingId ? "更新" : "添加"}
          </button>
          {editingId && (
            <button className="button" onClick={resetForm}>
              取消编辑
            </button>
          )}
          {status && <span className="text-sm text-[color:var(--muted)]">{status}</span>}
        </div>
      </div>

      <div className="card p-6 flex flex-col gap-4">
        <div className="text-lg font-semibold tracking-tight flex justify-between items-center">
          <span>论文列表</span>
          <span className="text-sm text-[color:var(--muted)] font-normal">
            共 {papers.length} 篇
          </span>
        </div>

        {loading ? (
          <div className="text-sm text-[color:var(--muted)]">加载中...</div>
        ) : papers.length === 0 ? (
          <div className="text-sm text-[color:var(--muted)]">暂无论文记录</div>
        ) : (
          <div className="flex flex-col gap-4">
            {papers.map((p) => (
              <div key={p.id} className="border border-[color:var(--border)] rounded-xl p-4 flex flex-col gap-2 hover:border-[color:var(--accent)] transition-colors">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-lg">{p.title}</div>
                  <div className="flex gap-2 shrink-0">
                    <button className="button text-xs py-1" onClick={() => editPaper(p)}>编辑</button>
                    <button className="button text-xs py-1 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deletePaper(p.id)}>删除</button>
                  </div>
                </div>
                <div className="text-sm text-[color:var(--text)]">{p.authors}</div>
                <div className="text-sm text-[color:var(--muted)] flex items-center gap-4">
                  <span className="bg-[color:var(--panel)] px-2 py-0.5 rounded-md">{p.journal}</span>
                  <span>{p.year}</span>
                  {p.pdfUrl && (
                    <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:underline flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      查看 PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
