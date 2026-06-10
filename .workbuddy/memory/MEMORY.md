## 技术架构
- Next.js 15 App Router + React 19 + Tailwind CSS v4
- Neon Serverless PostgreSQL（通过 @neondatabase/serverless 连接）
- 后台管理面板在 /admin，左侧垂直导航栏布局
- 每个功能模块：db.ts 建表 → /api/admin/xxx/ API 路由 → 组件渲染
- API 路由模式：GET 公开读取，POST/PUT/DELETE 需 assertAdmin 认证
- 组件模式：独立 Tab 组件放在 src/components/admin/ 下，admin/page.tsx 中引入
- 所有 lint 0 错误

## 项目功能
- 个人主页：Hero、About、Research、Publications、Projects、Experience、Contact
- 后台管理：笔记、今日计划（拖拽排序）、每日记录（含图表）、体型追踪（IndexedDB）、论文管理、文档管理、**读书笔记**（2026-06-09 新增）
