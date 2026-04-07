# 本地运行与一键部署指南（Vercel / Netlify / GitHub Pages）

本项目为 Next.js 静态导出（`output: "export"`），构建产物是纯静态文件目录 `out/`，可部署到任意静态托管平台。

## 1) 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 2) 本地构建与预览（纯静态）

```bash
npm run build
npm run preview
```

说明：
- `npm run build` 生成 `out/`
- `npm run preview` 会用静态服务器启动 `out/`（默认端口 `4173`）

## 3) Vercel 一键部署

### 步骤
1. 将仓库推送到 GitHub。
2. 打开 Vercel 并导入该仓库。
3. 保持默认构建设置即可（Vercel 会自动识别 Next.js）。
4. 部署完成后获得站点 URL。

### 可选：Vercel Deploy Button
将下面链接中的 `repository-url` 替换为你的仓库地址：

`https://vercel.com/new/clone?repository-url=https://github.com/<you>/<repo>`

## 4) Netlify 一键部署

项目已提供 `netlify.toml`：
- build command: `npm run build`
- publish directory: `out`

### 步骤
1. 将仓库推送到 GitHub。
2. 打开 Netlify，选择 “Add new site → Import an existing project”。
3. 选择该仓库并确认构建配置。
4. 部署完成后获得站点 URL。

## 5) GitHub Pages 一键部署（Actions）

项目已提供 `.github/workflows/deploy.yml`，会在 `main` 分支 push 时自动构建并发布到 Pages。

### 步骤
1. 确保仓库默认分支为 `main`。
2. GitHub 仓库 → Settings → Pages。
3. Build and deployment 选择：Source = GitHub Actions。
4. 推送一次提交到 `main`，等待 Actions 完成。
5. 站点地址通常为：`https://<you>.github.io/<repo>/`。

### 注意（Base Path）
GitHub Pages 站点通常有仓库路径前缀（`/<repo>`）。工作流已自动设置：
- `NEXT_PUBLIC_BASE_PATH=/${{ github.event.repository.name }}`

因此无需手动修改 `next.config.ts`。
