# 科研技术向程序员个人主页（Next.js 静态导出）

单页滚动式个人主页模板：锚点导航 / 移动菜单 / 主题切换 / 论文 BibTeX 复制 / 项目卡片。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 构建与预览（纯静态）

```bash
npm run build
npm run preview
```

构建产物在 `out/`。

## 内容修改

- 主要内容集中在 `src/lib/site-data.ts`（姓名、头衔、研究方向、项目、论文、履历、外链等）。
- 简历下载文件默认指向 `public/cv.txt`，你可以替换为 `public/cv.pdf` 并修改 `site.cvUrl`。

## 一键部署指南

请查看 `DEPLOY.md`。
