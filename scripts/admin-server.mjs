import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const port = Number.parseInt(process.env.ADMIN_PORT ?? process.env.PORT ?? "8787", 10);

const dbPath = resolve(process.cwd(), process.env.NOTES_DB_PATH ?? "data/notes.json");
const adminToken = process.env.ADMIN_TOKEN ?? "";

const corsOrigins = (process.env.NOTES_CORS_ORIGIN ??
  "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function getCorsOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return "";
  return corsOrigins.includes(origin) ? origin : "";
}

function setCorsHeaders(req, res) {
  const allowOrigin = getCorsOrigin(req);
  if (allowOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
}

function sendJson(res, status, data) {
  const json = JSON.stringify(data, null, 2);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(json);
}

function sendHtml(res, status, html) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}

function readBearerToken(req) {
  const v = req.headers.authorization ?? "";
  const m = v.match(/^Bearer\s+(.+)\s*$/i);
  return m?.[1] ?? "";
}

function isAuthed(req) {
  if (!adminToken) return false;
  return readBearerToken(req) === adminToken;
}

async function readBodyJson(req, maxBytes = 1024 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const err = new Error("Payload too large");
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error("Invalid JSON");
    err.statusCode = 400;
    throw err;
  }
}

async function loadDb() {
  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { notes: parsed, plans: [] };
    if (parsed && typeof parsed === "object") {
      return {
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        plans: Array.isArray(parsed.plans) ? parsed.plans : [],
      };
    }
    return { notes: [], plans: [] };
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return { notes: [], plans: [] };
    }
    throw e;
  }
}

async function saveDb(db) {
  await mkdir(dirname(dbPath), { recursive: true });
  const tmpPath = `${dbPath}.tmp`;
  await writeFile(
    tmpPath,
    JSON.stringify(
      {
        version: 1,
        notes: Array.isArray(db?.notes) ? db.notes : [],
        plans: Array.isArray(db?.plans) ? db.plans : [],
      },
      null,
      2
    ),
    "utf8"
  );
  await rename(tmpPath, dbPath);
}

async function loadNotes() {
  const db = await loadDb();
  return db.notes;
}

async function saveNotes(notes) {
  const db = await loadDb();
  db.notes = Array.isArray(notes) ? notes : [];
  await saveDb(db);
}

function pickPublic(note) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    visibility: note.visibility,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    tags: note.tags ?? [],
  };
}

function sanitizeNewNote(input) {
  const title =
    typeof input?.title === "string" ? input.title.trim() : "";
  const content =
    typeof input?.content === "string" ? input.content : "";
  const visibility = input?.visibility === "public" ? "public" : "private";
  const tags = Array.isArray(input?.tags)
    ? input.tags.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 20)
    : [];

  if (!title) {
    const err = new Error("title is required");
    err.statusCode = 400;
    throw err;
  }
  if (title.length > 200) {
    const err = new Error("title is too long");
    err.statusCode = 400;
    throw err;
  }
  if (content.length > 200_000) {
    const err = new Error("content is too long");
    err.statusCode = 400;
    throw err;
  }

  return { title, content, visibility, tags };
}

function isValidDateYmd(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidTimeHm(s) {
  return typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
}

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sanitizeNewPlan(input) {
  const title = typeof input?.title === "string" ? input.title.trim() : "";
  const date = isValidDateYmd(input?.date) ? input.date : todayYmd();
  const startTime = isValidTimeHm(input?.startTime) ? input.startTime : "";
  const endTime = isValidTimeHm(input?.endTime) ? input.endTime : "";
  const done = input?.done === true;

  if (!title) {
    const err = new Error("title is required");
    err.statusCode = 400;
    throw err;
  }
  if (title.length > 200) {
    const err = new Error("title is too long");
    err.statusCode = 400;
    throw err;
  }
  if (startTime && endTime && startTime > endTime) {
    const err = new Error("startTime must be <= endTime");
    err.statusCode = 400;
    throw err;
  }

  return { title, date, startTime, endTime, done };
}

function renderAdminHtml() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Notes Admin</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 24px; }
      .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
      input, select, textarea, button { font: inherit; padding: 8px 10px; }
      textarea { width: 100%; min-height: 240px; }
      .card { border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin-top: 14px; max-width: 900px; }
      .muted { color: #666; font-size: 14px; }
      .list { margin-top: 14px; max-width: 900px; }
      .item { padding: 10px 0; border-bottom: 1px solid #eee; }
      .itemTitle { font-weight: 600; }
      .tag { display: inline-block; padding: 2px 8px; border: 1px solid #ddd; border-radius: 999px; margin-right: 6px; font-size: 12px; }
      code { background: #f6f6f6; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <h1>Notes Admin</h1>
    <div class="muted">
      需要在环境变量里配置 <code>ADMIN_TOKEN</code>（相当于后台登录密码）。请求会用 <code>Authorization: Bearer &lt;password&gt;</code>。
    </div>

    <div class="card">
      <div class="row">
        <label>密码 <input id="token" type="password" placeholder="ADMIN_TOKEN" style="min-width: 260px" /></label>
        <button id="saveToken">登录</button>
        <button id="reload">刷新列表</button>
      </div>
    </div>

    <div class="card">
      <h2>新建日记/笔记</h2>
      <div class="row">
        <label>标题 <input id="title" type="text" style="min-width: 360px" /></label>
        <label>可见性
          <select id="visibility">
            <option value="private">私有</option>
            <option value="public">可展示</option>
          </select>
        </label>
        <label>标签 <input id="tags" type="text" placeholder="用逗号分隔" style="min-width: 260px" /></label>
      </div>
      <div style="margin-top: 10px">
        <textarea id="content" placeholder="支持 Markdown 文本…"></textarea>
      </div>
      <div class="row" style="margin-top: 10px">
        <button id="create">上传</button>
        <span id="status" class="muted"></span>
      </div>
    </div>

    <div class="list">
      <h2>全部笔记（含私有）</h2>
      <div id="list" class="muted">加载中…</div>
    </div>

    <script>
      const $ = (id) => document.getElementById(id);
      const status = (t) => ($("status").textContent = t || "");
      const getToken = () => localStorage.getItem("ADMIN_TOKEN") || "";
      const setToken = (t) => localStorage.setItem("ADMIN_TOKEN", t);

      $("token").value = getToken();
      $("saveToken").onclick = () => { setToken($("token").value.trim()); status("已登录"); reload(); };

      async function api(path, init = {}) {
        const token = getToken();
        const headers = Object.assign({ "Content-Type": "application/json" }, init.headers || {});
        if (token) headers["Authorization"] = "Bearer " + token;
        const res = await fetch(path, Object.assign({}, init, { headers }));
        const text = await res.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
        if (!res.ok) throw new Error((data && data.error) ? data.error : ("HTTP " + res.status));
        return data;
      }

      function renderItem(n) {
        const tags = (n.tags || []).map((t) => '<span class="tag">' + t + '</span>').join("");
        return \`
          <div class="item">
            <div class="row" style="justify-content: space-between">
              <div>
                <span class="itemTitle">\${n.title}</span>
                <span class="muted"> · \${n.visibility} · \${new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <div class="row">
                <button data-del="\${n.id}">删除</button>
              </div>
            </div>
            <div style="margin-top: 6px">\${tags}</div>
          </div>
        \`;
      }

      async function reload() {
        status("");
        $("list").textContent = "加载中…";
        try {
          const notes = await api("/api/notes");
          $("list").innerHTML = notes.length ? notes.map(renderItem).join("") : "<div class='muted'>暂无数据</div>";
          document.querySelectorAll("[data-del]").forEach((btn) => {
            btn.onclick = async () => {
              const id = btn.getAttribute("data-del");
              if (!confirm("确定删除？")) return;
              try {
                await api("/api/notes/" + encodeURIComponent(id), { method: "DELETE" });
                await reload();
              } catch (e) {
                alert(e.message);
              }
            };
          });
        } catch (e) {
          $("list").textContent = "加载失败：" + e.message;
        }
      }

      $("reload").onclick = reload;

      $("create").onclick = async () => {
        status("上传中…");
        const payload = {
          title: $("title").value,
          content: $("content").value,
          visibility: $("visibility").value,
          tags: $("tags").value.split(",").map((s) => s.trim()).filter(Boolean),
        };
        try {
          await api("/api/notes", { method: "POST", body: JSON.stringify(payload) });
          $("title").value = "";
          $("content").value = "";
          $("tags").value = "";
          $("visibility").value = "private";
          status("已上传");
          await reload();
        } catch (e) {
          status("失败：" + e.message);
        }
      };

      reload();
    </script>
  </body>
</html>`;
}

function renderAdminHtmlV2() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Journal Admin</title>
    <style>
      :root {
        --bg0: #0b0f17;
        --bg1: #0e1627;
        --border: rgba(255,255,255,0.14);
        --text: rgba(255,255,255,0.92);
        --muted: rgba(255,255,255,0.65);
        --muted2: rgba(255,255,255,0.52);
        --accent: #7c5cff;
        --accent2: #20d3ff;
        --danger: #ff3b6b;
        --shadow: 0 20px 50px rgba(0,0,0,0.45);
      }
      * { box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        color: var(--text);
        background: radial-gradient(1200px 800px at 20% 10%, rgba(124,92,255,0.35), transparent 60%),
                    radial-gradient(1000px 700px at 80% 20%, rgba(32,211,255,0.22), transparent 55%),
                    linear-gradient(180deg, var(--bg0), var(--bg1));
      }
      .wrap { max-width: 1120px; margin: 0 auto; padding: 28px 18px 42px; }
      .topbar {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 16px 16px;
        border: 1px solid var(--border);
        background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05));
        border-radius: 18px;
        box-shadow: var(--shadow);
        position: sticky; top: 16px; z-index: 20;
        backdrop-filter: blur(10px);
      }
      .brand { display: flex; align-items: center; gap: 12px; }
      .logo {
        width: 38px; height: 38px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: radial-gradient(18px 18px at 30% 20%, rgba(255,255,255,0.22), transparent 60%),
                    linear-gradient(135deg, rgba(124,92,255,0.9), rgba(32,211,255,0.7));
      }
      .brandTitle { font-weight: 700; letter-spacing: 0.2px; }
      .brandSub { font-size: 12px; color: var(--muted); margin-top: 2px; }
      .right { display: flex; align-items: center; gap: 10px; }
      .pill {
        padding: 8px 12px;
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.05);
        border-radius: 999px;
        font-size: 12px;
        color: var(--muted);
      }
      .grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; margin-top: 16px; }
      @media (max-width: 980px) { .grid { grid-template-columns: 1fr; } .topbar { position: static; } }
      .card {
        border: 1px solid var(--border);
        background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.04));
        border-radius: 18px;
        box-shadow: var(--shadow);
      }
      .cardHd { padding: 16px 16px 0; }
      .cardTitle { font-weight: 700; font-size: 15px; }
      .cardDesc { color: var(--muted); font-size: 12px; margin-top: 6px; }
      .cardBd { padding: 14px 16px 16px; }
      .tabs { display: flex; gap: 8px; margin-top: 12px; }
      .tab {
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.04);
        color: var(--muted);
        padding: 8px 12px;
        border-radius: 999px;
        cursor: pointer;
      }
      .tab[aria-selected="true"] {
        color: var(--text);
        background: linear-gradient(135deg, rgba(124,92,255,0.35), rgba(32,211,255,0.18));
        border-color: rgba(255,255,255,0.22);
      }
      .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
      .field { display: flex; flex-direction: column; gap: 6px; min-width: 180px; flex: 1; }
      .label { font-size: 12px; color: var(--muted); }
      input, select, textarea {
        width: 100%;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(5,10,18,0.55);
        color: var(--text);
        outline: none;
      }
      textarea { min-height: 220px; resize: vertical; line-height: 1.55; }
      input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.34); }
      .btn {
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(255,255,255,0.06);
        color: var(--text);
        cursor: pointer;
      }
      .btnPrimary {
        border-color: rgba(255,255,255,0.22);
        background: linear-gradient(135deg, rgba(124,92,255,0.75), rgba(32,211,255,0.55));
      }
      .btnDanger {
        border-color: rgba(255,255,255,0.18);
        background: rgba(255,59,107,0.14);
      }
      .btnGhost {
        border-color: transparent;
        background: transparent;
        color: var(--muted);
      }
      .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .hint { font-size: 12px; color: var(--muted2); }
      .status { font-size: 12px; color: var(--muted); }
      .status.ok { color: rgba(52,211,153,0.9); }
      .status.bad { color: rgba(255,59,107,0.9); }
      .list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
      .item {
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 16px;
        background: rgba(255,255,255,0.04);
        padding: 12px 12px;
      }
      .itemTop { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .itemTitle { font-weight: 650; }
      .meta { font-size: 12px; color: var(--muted); margin-top: 4px; }
      .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
      .tag { font-size: 12px; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); color: var(--muted); background: rgba(255,255,255,0.03); }
      .divider { height: 1px; background: rgba(255,255,255,0.12); margin: 12px 0; }
      .loginBox { max-width: 520px; margin: 60px auto 0; }
      .loginTitle { font-size: 20px; font-weight: 750; }
      .loginSub { font-size: 13px; color: var(--muted); margin-top: 8px; line-height: 1.6; }
      .kbd { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas; font-size: 12px; padding: 2px 8px; border: 1px solid rgba(255,255,255,0.16); border-radius: 8px; background: rgba(0,0,0,0.25); color: rgba(255,255,255,0.82); }
      .planRow { display: grid; grid-template-columns: 110px 110px 1fr 110px; gap: 10px; align-items: center; }
      @media (max-width: 700px) { .planRow { grid-template-columns: 1fr; } }
      .chk { display: inline-flex; align-items: center; gap: 10px; }
      .chk input { width: 18px; height: 18px; }
      .time { font-feature-settings: "tnum"; font-variant-numeric: tabular-nums; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div id="root"></div>
    </div>

    <script>
      const el = (tag, attrs = {}, children = []) => {
        const n = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) {
          if (k === "class") n.className = v;
          else if (k === "text") n.textContent = v;
          else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
          else if (v === true) n.setAttribute(k, "");
          else if (v !== false && v != null) n.setAttribute(k, String(v));
        }
        for (const c of children) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
        return n;
      };

      const storeKey = "ADMIN_TOKEN";
      const getToken = () => localStorage.getItem(storeKey) || "";
      const setToken = (t) => localStorage.setItem(storeKey, t);
      const clearToken = () => localStorage.removeItem(storeKey);

      const state = {
        token: getToken(),
        authed: false,
        tab: "notes",
        notes: [],
        plans: [],
        editingNoteId: "",
        loading: false,
        status: "",
        statusKind: "",
      };

      const api = async (path, init = {}) => {
        const headers = Object.assign({ "Content-Type": "application/json" }, init.headers || {});
        if (state.token) headers["Authorization"] = "Bearer " + state.token;
        const res = await fetch(path, Object.assign({}, init, { headers }));
        const text = await res.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
        if (!res.ok) {
          const msg = (data && data.error) ? data.error : ("HTTP " + res.status);
          const err = new Error(msg);
          err.status = res.status;
          throw err;
        }
        return data;
      };

      const setStatus = (msg, kind = "") => {
        state.status = msg || "";
        state.statusKind = kind;
        render();
      };

      const fmtDateTime = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        return d.toLocaleString();
      };

      const todayYmd = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return y + "-" + m + "-" + day;
      };

      const checkAuth = async () => {
        if (!state.token) return false;
        try { await api("/api/auth/check"); return true; } catch { return false; }
      };

      const loadAll = async () => {
        state.loading = true;
        render();
        try {
          const [notes, plans] = await Promise.all([
            api("/api/notes"),
            api("/api/plans/today"),
          ]);
          state.notes = Array.isArray(notes) ? notes : [];
          state.plans = Array.isArray(plans) ? plans : [];
          state.loading = false;
          setStatus("已同步", "ok");
        } catch (e) {
          state.loading = false;
          setStatus("加载失败：" + e.message, "bad");
        }
      };

      const login = async (password) => {
        state.token = (password || "").trim();
        render();
        try {
          await api("/api/auth/check");
          setToken(state.token);
          state.authed = true;
          setStatus("登录成功", "ok");
          await loadAll();
        } catch (e) {
          state.authed = false;
          clearToken();
          state.token = "";
          setStatus("登录失败：" + e.message, "bad");
        }
      };

      const logout = () => {
        clearToken();
        state.token = "";
        state.authed = false;
        state.notes = [];
        state.plans = [];
        state.editingNoteId = "";
        setStatus("已退出", "");
      };

      const createOrUpdateNote = async (payload) => {
        setStatus("保存中…", "");
        try {
          if (state.editingNoteId) {
            await api("/api/notes/" + encodeURIComponent(state.editingNoteId), { method: "PUT", body: JSON.stringify(payload) });
          } else {
            await api("/api/notes", { method: "POST", body: JSON.stringify(payload) });
          }
          state.editingNoteId = "";
          await loadAll();
          setStatus("已保存", "ok");
        } catch (e) {
          setStatus("失败：" + e.message, "bad");
        }
      };

      const deleteNote = async (id) => {
        if (!confirm("确定删除这条笔记？")) return;
        setStatus("删除中…", "");
        try {
          await api("/api/notes/" + encodeURIComponent(id), { method: "DELETE" });
          if (state.editingNoteId === id) state.editingNoteId = "";
          await loadAll();
          setStatus("已删除", "ok");
        } catch (e) {
          setStatus("失败：" + e.message, "bad");
        }
      };

      const createPlan = async (payload) => {
        setStatus("保存中…", "");
        try {
          await api("/api/plans", { method: "POST", body: JSON.stringify(payload) });
          await loadAll();
          setStatus("已保存", "ok");
        } catch (e) {
          setStatus("失败：" + e.message, "bad");
        }
      };

      const updatePlan = async (id, patch) => {
        try {
          await api("/api/plans/" + encodeURIComponent(id), { method: "PUT", body: JSON.stringify(patch) });
          await loadAll();
        } catch (e) {
          setStatus("失败：" + e.message, "bad");
        }
      };

      const deletePlan = async (id) => {
        if (!confirm("确定删除这条计划？")) return;
        setStatus("删除中…", "");
        try {
          await api("/api/plans/" + encodeURIComponent(id), { method: "DELETE" });
          await loadAll();
          setStatus("已删除", "ok");
        } catch (e) {
          setStatus("失败：" + e.message, "bad");
        }
      };

      const viewLogin = () => {
        const passwordInput = el("input", { type: "password", placeholder: "后台密码" });
        const submitBtn = el("button", { class: "btn btnPrimary", text: "登录", onclick: async () => await login(passwordInput.value) });
        return el("div", { class: "card loginBox" }, [
          el("div", { class: "cardHd" }, [
            el("div", { class: "loginTitle", text: "日记后台" }),
            el("div", { class: "loginSub" }, [
              "先登录，再填写笔记与今日工作计划。",
              el("div", { style: "margin-top:10px" }, ["鉴权格式： ", el("span", { class: "kbd", text: "Authorization: Bearer <password>" })]),
            ]),
          ]),
          el("div", { class: "cardBd" }, [
            el("div", { class: "row" }, [
              el("div", { class: "field", style: "min-width:260px" }, [
                el("div", { class: "label", text: "密码" }),
                passwordInput,
              ]),
              submitBtn,
            ]),
            el("div", { style: "margin-top:10px" }, [el("div", { class: "hint", text: "此密码来自环境变量 ADMIN_TOKEN。" })]),
            state.status ? el("div", { class: "status " + (state.statusKind || ""), style: "margin-top:12px", text: state.status }) : el("div"),
          ]),
        ]);
      };

      const viewTopbar = () => {
        return el("div", { class: "topbar" }, [
          el("div", { class: "brand" }, [
            el("div", { class: "logo" }),
            el("div", {}, [
              el("div", { class: "brandTitle", text: "Journal Admin" }),
              el("div", { class: "brandSub", text: "笔记 · 私有/可展示 · 今日计划" }),
            ]),
          ]),
          el("div", { class: "right" }, [
            el("div", { class: "pill" }, ["Today: ", el("span", { class: "time", text: todayYmd() })]),
            el("button", { class: "btn", text: "同步", onclick: loadAll, disabled: state.loading }),
            el("button", { class: "btn btnGhost", text: "退出", onclick: logout }),
          ]),
        ]);
      };

      const viewTabs = () => {
        return el("div", { class: "tabs" }, [
          el("button", { class: "tab", role: "tab", "aria-selected": state.tab === "notes", onclick: () => { state.tab = "notes"; render(); } }, ["笔记"]),
          el("button", { class: "tab", role: "tab", "aria-selected": state.tab === "plans", onclick: () => { state.tab = "plans"; render(); } }, ["今日计划"]),
        ]);
      };

      const viewNoteEditor = () => {
        const editing = state.notes.find((n) => n.id === state.editingNoteId) || null;
        const title = el("input", { type: "text", placeholder: "标题", value: editing ? editing.title : "" });
        const visibility = el("select", {}, [
          el("option", { value: "private", text: "私有" }),
          el("option", { value: "public", text: "可展示" }),
        ]);
        visibility.value = editing ? editing.visibility : "private";
        const tags = el("input", { type: "text", placeholder: "标签，用逗号分隔", value: editing ? (editing.tags || []).join(",") : "" });
        const content = el("textarea", { placeholder: "写下今天的日记/笔记（支持 Markdown 文本）…" }, [editing ? (editing.content || "") : ""]);

        const save = el("button", { class: "btn btnPrimary", text: editing ? "保存修改" : "保存笔记", onclick: async () => {
          await createOrUpdateNote({
            title: title.value,
            content: content.value,
            visibility: visibility.value,
            tags: tags.value.split(",").map((s) => s.trim()).filter(Boolean),
          });
        } });

        const cancel = el("button", { class: "btn", text: "清空", onclick: () => { state.editingNoteId = ""; render(); } });

        const metaText = editing
          ? "创建于 " + fmtDateTime(editing.createdAt) + " · 更新于 " + fmtDateTime(editing.updatedAt)
          : "新建一条笔记：可选私有或可展示（public）。";

        return el("div", { class: "card" }, [
          el("div", { class: "cardHd" }, [
            el("div", { class: "cardTitle", text: "填写笔记" }),
            el("div", { class: "cardDesc", text: metaText }),
            viewTabs(),
          ]),
          el("div", { class: "cardBd" }, [
            el("div", { class: "row" }, [
              el("div", { class: "field", style: "min-width: 260px" }, [el("div", { class: "label", text: "标题" }), title]),
              el("div", { class: "field", style: "min-width: 160px; max-width: 220px" }, [el("div", { class: "label", text: "可见性" }), visibility]),
              el("div", { class: "field", style: "min-width: 260px" }, [el("div", { class: "label", text: "标签" }), tags]),
            ]),
            el("div", { style: "margin-top: 12px" }, [
              el("div", { class: "label", text: "内容" }),
              content,
            ]),
            el("div", { class: "row", style: "margin-top: 12px; justify-content: space-between" }, [
              el("div", { class: "row" }, [save, cancel]),
              state.status ? el("div", { class: "status " + (state.statusKind || ""), text: state.status }) : el("div"),
            ]),
          ]),
        ]);
      };

      const viewNotesList = () => {
        const filter = el("select", {}, [
          el("option", { value: "all", text: "全部" }),
          el("option", { value: "public", text: "只看可展示" }),
          el("option", { value: "private", text: "只看私有" }),
        ]);
        filter.value = "all";
        const search = el("input", { type: "text", placeholder: "搜索标题/标签…" });
        const list = el("div", { class: "list" });

        const renderList = () => {
          const q = (search.value || "").trim().toLowerCase();
          const mode = filter.value;
          const items = (state.notes || []).filter((n) => {
            if (mode !== "all" && n.visibility !== mode) return false;
            if (!q) return true;
            const inTitle = (n.title || "").toLowerCase().includes(q);
            const inTags = (n.tags || []).some((t) => (t || "").toLowerCase().includes(q));
            return inTitle || inTags;
          });
          list.innerHTML = "";
          if (!items.length) {
            list.appendChild(el("div", { class: "hint", text: "暂无数据" }));
            return;
          }
          for (const n of items) {
            const tags = el("div", { class: "tags" }, (n.tags || []).map((t) => el("span", { class: "tag", text: t })));
            const editBtn = el("button", { class: "btn", text: "编辑", onclick: () => { state.editingNoteId = n.id; state.tab = "notes"; render(); } });
            const delBtn = el("button", { class: "btn btnDanger", text: "删除", onclick: async () => await deleteNote(n.id) });
            const top = el("div", { class: "itemTop" }, [
              el("div", {}, [
                el("div", { class: "itemTitle", text: n.title }),
                el("div", { class: "meta", text: n.visibility + " · " + fmtDateTime(n.createdAt) }),
              ]),
              el("div", { class: "row" }, [editBtn, delBtn]),
            ]);
            list.appendChild(el("div", { class: "item" }, [top, tags]));
          }
        };

        filter.addEventListener("change", renderList);
        search.addEventListener("input", renderList);

        const refresh = el("button", { class: "btn", text: "刷新", onclick: async () => { await loadAll(); renderList(); }, disabled: state.loading });

        const panel = el("div", { class: "card" }, [
          el("div", { class: "cardHd" }, [
            el("div", { class: "cardTitle", text: "笔记列表" }),
            el("div", { class: "cardDesc", text: "点击编辑会把内容载入左侧；删除不可恢复。" }),
          ]),
          el("div", { class: "cardBd" }, [
            el("div", { class: "row" }, [
              el("div", { class: "field", style: "min-width: 180px; max-width: 220px" }, [el("div", { class: "label", text: "筛选" }), filter]),
              el("div", { class: "field", style: "min-width: 220px" }, [el("div", { class: "label", text: "搜索" }), search]),
              el("div", { style: "flex: 0 0 auto; align-self: flex-end" }, [refresh]),
            ]),
            el("div", { class: "divider" }),
            list,
          ]),
        ]);

        setTimeout(renderList, 0);
        return panel;
      };

      const viewPlans = () => {
        const date = todayYmd();
        const startTime = el("input", { type: "time", value: "09:00" });
        const endTime = el("input", { type: "time", value: "10:00" });
        const title = el("input", { type: "text", placeholder: "计划事项（例如：整理实验结果）" });
        const addBtn = el("button", { class: "btn btnPrimary", text: "添加", onclick: async () => {
          await createPlan({ date, startTime: startTime.value, endTime: endTime.value, title: title.value, done: false });
          title.value = "";
        } });

        const list = el("div", { class: "list" });
        const items = (state.plans || []).slice();

        if (!items.length) {
          list.appendChild(el("div", { class: "hint", text: "今天还没有计划。先在上面添加一条。" }));
        } else {
          for (const p of items) {
            const checkbox = el("input", { type: "checkbox" });
            checkbox.checked = p.done === true;
            checkbox.addEventListener("change", async () => await updatePlan(p.id, { title: p.title, date: p.date, startTime: p.startTime || "", endTime: p.endTime || "", done: checkbox.checked }));
            const tStart = el("input", { type: "time", value: p.startTime || "" });
            const tEnd = el("input", { type: "time", value: p.endTime || "" });
            const tTitle = el("input", { type: "text", value: p.title || "" });
            const saveBtn = el("button", { class: "btn", text: "保存", onclick: async () => await updatePlan(p.id, { title: tTitle.value, date: p.date, startTime: tStart.value, endTime: tEnd.value, done: checkbox.checked }) });
            const delBtn = el("button", { class: "btn btnDanger", text: "删除", onclick: async () => await deletePlan(p.id) });
            const meta = ((p.startTime || "") + (p.endTime ? " - " + p.endTime : "")).trim();
            list.appendChild(el("div", { class: "item" }, [
              el("div", { class: "itemTop" }, [
                el("div", {}, [
                  el("div", { class: "itemTitle", text: p.title }),
                  el("div", { class: "meta", text: meta }),
                ]),
                el("div", { class: "row" }, [
                  el("span", { class: "tag", text: p.done ? "已完成" : "进行中" }),
                  el("span", { class: "hint", text: fmtDateTime(p.updatedAt || p.createdAt) }),
                ]),
              ]),
              el("div", { class: "row", style: "margin-top: 10px" }, [
                el("div", { class: "chk" }, [checkbox, el("div", { class: "hint", text: "完成" })]),
              ]),
              el("div", { class: "planRow", style: "margin-top: 10px" }, [
                el("div", { class: "field" }, [el("div", { class: "label", text: "开始" }), tStart]),
                el("div", { class: "field" }, [el("div", { class: "label", text: "结束" }), tEnd]),
                el("div", { class: "field" }, [el("div", { class: "label", text: "事项" }), tTitle]),
                el("div", { class: "row", style: "align-self: flex-end; justify-content: flex-end" }, [saveBtn, delBtn]),
              ]),
            ]));
          }
        }

        return el("div", { class: "card" }, [
          el("div", { class: "cardHd" }, [
            el("div", { class: "cardTitle", text: "今日工作计划" }),
            el("div", { class: "cardDesc", text: "可规定时间段，勾选完成，随时编辑。" }),
            viewTabs(),
          ]),
          el("div", { class: "cardBd" }, [
            el("div", { class: "planRow" }, [
              el("div", { class: "field" }, [el("div", { class: "label", text: "开始" }), startTime]),
              el("div", { class: "field" }, [el("div", { class: "label", text: "结束" }), endTime]),
              el("div", { class: "field" }, [el("div", { class: "label", text: "事项" }), title]),
              el("div", { class: "row", style: "align-self: flex-end; justify-content: flex-end" }, [addBtn]),
            ]),
            el("div", { class: "divider" }),
            list,
            state.status ? el("div", { class: "status " + (state.statusKind || ""), style: "margin-top: 12px", text: state.status }) : el("div"),
          ]),
        ]);
      };

      const viewApp = () => {
        const root = el("div", {}, [viewTopbar()]);
        const main = el("div", { class: "grid" }, []);
        if (state.tab === "plans") {
          main.appendChild(viewPlans());
          main.appendChild(viewNotesList());
        } else {
          main.appendChild(viewNoteEditor());
          main.appendChild(viewNotesList());
        }
        root.appendChild(main);
        return root;
      };

      const render = () => {
        const host = document.getElementById("root");
        host.innerHTML = "";
        host.appendChild(state.authed ? viewApp() : viewLogin());
      };

      (async () => {
        state.authed = await checkAuth();
        render();
        if (state.authed) await loadAll();
      })();
    </script>
  </body>
</html>`;
}

const server = createServer(async (req, res) => {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", "http://localhost");
  const method = req.method ?? "GET";

  try {
    if (method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (method === "GET" && url.pathname === "/api/auth/check") {
      if (!isAuthed(req)) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    if (method === "GET" && url.pathname === "/admin") {
      if (!adminToken) {
        sendHtml(
          res,
          500,
          "<pre>ADMIN_TOKEN 未配置。请设置环境变量 ADMIN_TOKEN 后重启服务。</pre>"
        );
        return;
      }
      sendHtml(res, 200, renderAdminHtmlV2());
      return;
    }

    if (url.pathname === "/api/notes/public" && method === "GET") {
      const notes = await loadNotes();
      const pub = notes
        .filter((n) => n.visibility === "public")
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      sendJson(res, 200, pub.map(pickPublic));
      return;
    }

    if (url.pathname === "/api/notes" && method === "GET") {
      if (!isAuthed(req)) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }
      const notes = await loadNotes();
      const sorted = notes.sort((a, b) =>
        (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
      );
      sendJson(res, 200, sorted.map(pickPublic));
      return;
    }

    if (url.pathname === "/api/notes" && method === "POST") {
      if (!isAuthed(req)) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }
      const body = await readBodyJson(req);
      const cleaned = sanitizeNewNote(body);
      const now = new Date().toISOString();
      const note = {
        id: randomUUID(),
        ...cleaned,
        createdAt: now,
        updatedAt: now,
      };
      const notes = await loadNotes();
      notes.unshift(note);
      await saveNotes(notes);
      sendJson(res, 201, pickPublic(note));
      return;
    }

    if (url.pathname === "/api/plans/today" && method === "GET") {
      if (!isAuthed(req)) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }
      const db = await loadDb();
      const date = todayYmd();
      const items = db.plans
        .filter((p) => p.date === date)
        .sort((a, b) => {
          const ta = (a.startTime ?? "") + (a.endTime ?? "");
          const tb = (b.startTime ?? "") + (b.endTime ?? "");
          if (ta !== tb) return ta.localeCompare(tb);
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        });
      sendJson(res, 200, items);
      return;
    }

    if (url.pathname === "/api/plans" && method === "GET") {
      if (!isAuthed(req)) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }
      const date = url.searchParams.get("date") || todayYmd();
      const db = await loadDb();
      const items = db.plans
        .filter((p) => p.date === date)
        .sort((a, b) => {
          const ta = (a.startTime ?? "") + (a.endTime ?? "");
          const tb = (b.startTime ?? "") + (b.endTime ?? "");
          if (ta !== tb) return ta.localeCompare(tb);
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        });
      sendJson(res, 200, items);
      return;
    }

    if (url.pathname === "/api/plans" && method === "POST") {
      if (!isAuthed(req)) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }
      const body = await readBodyJson(req);
      const cleaned = sanitizeNewPlan(body);
      const now = new Date().toISOString();
      const plan = {
        id: randomUUID(),
        ...cleaned,
        createdAt: now,
        updatedAt: now,
      };
      const db = await loadDb();
      db.plans.unshift(plan);
      await saveDb(db);
      sendJson(res, 201, plan);
      return;
    }

    const planIdMatch = url.pathname.match(/^\/api\/plans\/([^/]+)$/);
    if (planIdMatch) {
      if (!isAuthed(req)) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }
      const id = decodeURIComponent(planIdMatch[1]);
      const db = await loadDb();
      const idx = db.plans.findIndex((p) => p.id === id);

      if (method === "PUT") {
        if (idx < 0) {
          sendJson(res, 404, { error: "Not found" });
          return;
        }
        const body = await readBodyJson(req);
        const cleaned = sanitizeNewPlan(body);
        const updated = {
          ...db.plans[idx],
          ...cleaned,
          updatedAt: new Date().toISOString(),
        };
        db.plans[idx] = updated;
        await saveDb(db);
        sendJson(res, 200, updated);
        return;
      }

      if (method === "DELETE") {
        if (idx < 0) {
          sendJson(res, 404, { error: "Not found" });
          return;
        }
        const [deleted] = db.plans.splice(idx, 1);
        await saveDb(db);
        sendJson(res, 200, deleted);
        return;
      }
    }

    const noteIdMatch = url.pathname.match(/^\/api\/notes\/([^/]+)$/);
    if (noteIdMatch) {
      const id = decodeURIComponent(noteIdMatch[1]);
      const notes = await loadNotes();
      const idx = notes.findIndex((n) => n.id === id);

      if (method === "GET") {
        const note = notes[idx];
        if (!note) {
          sendJson(res, 404, { error: "Not found" });
          return;
        }
        if (note.visibility !== "public" && !isAuthed(req)) {
          sendJson(res, 404, { error: "Not found" });
          return;
        }
        sendJson(res, 200, pickPublic(note));
        return;
      }

      if (method === "PUT") {
        if (!isAuthed(req)) {
          sendJson(res, 401, { error: "Unauthorized" });
          return;
        }
        if (idx < 0) {
          sendJson(res, 404, { error: "Not found" });
          return;
        }
        const body = await readBodyJson(req);
        const cleaned = sanitizeNewNote(body);
        const updated = {
          ...notes[idx],
          ...cleaned,
          updatedAt: new Date().toISOString(),
        };
        notes[idx] = updated;
        await saveNotes(notes);
        sendJson(res, 200, pickPublic(updated));
        return;
      }

      if (method === "DELETE") {
        if (!isAuthed(req)) {
          sendJson(res, 401, { error: "Unauthorized" });
          return;
        }
        if (idx < 0) {
          sendJson(res, 404, { error: "Not found" });
          return;
        }
        const [deleted] = notes.splice(idx, 1);
        await saveNotes(notes);
        sendJson(res, 200, pickPublic(deleted));
        return;
      }
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (e) {
    const statusCode =
      e && typeof e === "object" && "statusCode" in e
        ? e.statusCode
        : 500;
    sendJson(res, statusCode, { error: e?.message ?? "Internal error" });
  }
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(
    [
      `Notes admin server is running`,
      `- URL:   http://localhost:${port}`,
      `- Admin: http://localhost:${port}/admin`,
      `- DB:    ${dbPath}`,
      adminToken ? "" : `- WARN:  ADMIN_TOKEN is not set (admin endpoints disabled)`,
      "",
    ]
      .filter(Boolean)
      .join("\n")
  );
});

