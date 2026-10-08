// 一次性脚本：用代码中的真实履历/项目/研究方向覆盖数据库里的旧站点内容
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(fileName) {
  try {
    const raw = readFileSync(resolve(process.cwd(), fileName), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}

loadEnv(".env.local");

const sql = neon(process.env.DATABASE_URL, { fullResults: true });

const experience = [
  {
    org: "武汉楚科研发部（原武汉铁路局信息所）",
    role: "软件工程师",
    time: "2022 — 至今",
    bullets: [
      "参与机车检修管理信息系统等核心业务系统的客户端开发。",
      "负责安卓手持机客户端功能迭代与架构优化，保障系统稳定运行。",
    ],
  },
  {
    org: "华中科技大学",
    role: "计算机科学与技术 · 学士",
    time: "2018 — 2022",
    bullets: [
      "第一学期就读于土木工程专业，第二学期起转专业至计算机科学与技术。",
      "系统学习数据结构、操作系统、计算机网络等核心课程，打下扎实工程基础。",
    ],
  },
  {
    org: "湖北省实验中学",
    role: "高中 · 理科",
    time: "2015 — 2018",
    bullets: ["理科方向学习，为后续计算机专业学习奠定基础。"],
  },
];

const researchAreas = [
  {
    title: "Android 客户端开发",
    keywords: ["Flutter", "Android", "手持机"],
    description:
      "面向铁路机务/客运场景的安卓手持机客户端开发，基于 Flutter 跨平台框架，覆盖检修、派工、调车、票务核销等核心业务，支持多环境打包与 CI/CD 自动化发布。",
  },
  {
    title: "业务系统工程化",
    keywords: ["架构", "可维护性", "自动化"],
    description:
      "从业务流程出发设计客户端架构：模块化拆分、状态管理、网络层封装、版本管理与自动化构建脚本，提升团队协作效率与交付质量。",
  },
  {
    title: "Web 个人系统",
    keywords: ["Next.js", "全栈", "个人工具"],
    description:
      "用 Next.js 构建个人数字花园，整合日记、计划、笔记与体型追踪，探索 Serverless 与本地存储的混合架构，让个人系统可持续迭代。",
  },
];

const projects = [
  {
    name: "机车检修手持机客户端 (jcjx-phone)",
    description:
      "面向安卓手持机定制开发的机车检修系统客户端，基于 Flutter。支持车间派工、检修进度、调车计划、售后临修登记、入段细录等核心作业场景，配置多环境 Flavor 与 CI/CD 自动化发布。",
    tech: ["Flutter", "Dart", "Android", "CI/CD"],
    repoUrl: "https://github.com/xuyu3hen/jcjx-phoneNew",
    featured: true,
  },
  {
    name: "机务系统数字化管控平台手机端 (jwDataCenter)",
    description:
      "机务系统数字化管控平台的移动端 APP，实现 200 项指标、31 张报表、违章违纪实时录入与确认申诉流程，支持消息推送与分层级权限控制。",
    tech: ["Flutter", "Android", "Push"],
    repoUrl: "https://github.com/xuyu3hen/jwDataCenter",
    featured: true,
  },
  {
    name: "车站客运管理手持端 (wkl_mobile)",
    description:
      "基于 Flutter 开发的车站客运管理手持端 App，覆盖 BOM 票务核销/验证、采购单据操作，提供离线凭证恢复、应用内 APK 更新、相册/拍照附件上传等能力。",
    tech: ["Flutter", "Dart", "Android"],
    repoUrl: "https://github.com/xuyu3hen/wkl_mobile",
    featured: true,
  },
  {
    name: "迷亭桑的梦想生活 (person)",
    description:
      "个人数字花园：Next.js 15 + React 19 构建的个人主页与后台管理系统，支持日记、笔记、计划、体型追踪等，部署于 Vercel。",
    tech: ["Next.js", "TypeScript", "Tailwind", "Vercel"],
    repoUrl: "https://github.com/xuyu3hen/person",
    featured: true,
  },
];

const about = {
  description:
    "客户端开发工程师，专注于安卓手持机应用开发与业务系统工程化。工作之余坚持健身减脂，规律生活，持续迭代。",
  systemLabel: "System Mindset",
  tags: ["Android", "Flutter", "客户端开发", "健身减脂中", "规律生活"],
  mbti: "INTJ",
  mbtiLabel: "Architect · 建筑师",
};

const researchSection = {
  description:
    "围绕安卓客户端开发与业务系统工程化，展示我持续投入的技术方向、工程实践与技术栈。",
  stats: [
    { label: "Flutter/Dart", value: 85 },
    { label: "Android 原生", value: 72 },
    { label: "前端/全栈", value: 75 },
    { label: "工程化/CI", value: 78 },
  ],
  methodologyTitle: "方法论",
  methodologyDescription:
    "从业务流程出发拆解问题：模块化设计、可维护架构、自动化构建与版本管理，让交付稳定可控、迭代可持续。",
  methodologyTags: [
    "Modularization",
    "State Management",
    "CI/CD",
    "Multi-Flavor",
    "Automation",
  ],
};

const heroPatch = {
  description:
    "客户端开发工程师，专注安卓手持机应用开发。用工程化方式整理工作、生活与长期目标，持续迭代。",
  focus: { label: "Focus", value: "Android Client x Flutter" },
  mode: { label: "Mode", value: "Build in Public, Think in Systems" },
  stack: { label: "Stack", value: "Flutter · Dart · Next.js · TS" },
};

// 学术成果区块数据来自 journal_papers 表，一并清空
const deletedPapers = await sql`DELETE FROM journal_papers RETURNING id`;
console.log("已清空论文条数:", deletedPapers.rows.length);

// 取出当前内容 → 在 JS 中整体合并 → 整行写回
const current = await sql`
  SELECT value FROM journal_site_content
  WHERE key = 'site_content' LIMIT 1;
`;

const existing =
  current.rows[0] && typeof current.rows[0].value === "object"
    ? current.rows[0].value
    : {};

const socials = [
  { label: "GitHub", href: "https://github.com/xuyu3hen" },
  { label: "知乎", href: "https://www.zhihu.com/people/miting-92" },
  { label: "Bilibili", href: "https://space.bilibili.com/337301704" },
];

const merged = {
  ...existing,
  socials,
  experience,
  researchAreas,
  projects,
  publications: [],
  awards: [],
  talks: [],
  about: { ...(existing.about ?? {}), ...about },
  researchSection: {
    ...(existing.researchSection ?? {}),
    ...researchSection,
  },
  hero: {
    ...(existing.hero ?? {}),
    description: heroPatch.description,
    focus: heroPatch.focus,
    mode: heroPatch.mode,
    stack: heroPatch.stack,
  },
};

const result = await sql`
  UPDATE journal_site_content
  SET value = ${JSON.stringify(merged)}::jsonb,
      updated_at = NOW()
  WHERE key = 'site_content'
  RETURNING updated_at;
`;

console.log("站点内容更新成功:", result.rows[0]);
