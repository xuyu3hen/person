export type SocialLink = {
  label: string;
  href: string;
};

export type ResearchArea = {
  title: string;
  keywords: string[];
  description: string;
};

export type Project = {
  name: string;
  description: string;
  tech: string[];
  repoUrl: string;
  demoUrl?: string;
  featured?: boolean;
};

export type Publication = {
  year: number;
  title: string;
  authors: string;
  venue: string;
  doiUrl?: string;
  pdfUrl?: string;
  codeUrl?: string;
  bibtex?: string;
};

export type TimelineItem = {
  org: string;
  role: string;
  time: string;
  bullets: string[];
};

export type AwardOrTalk = {
  year: number;
  title: string;
  note?: string;
  link?: string;
};

const projects: Project[] = [
  {
    name: "Personal Homepage",
    description:
      "Next.js 静态导出的科研技术向个人主页：单页滚动、主题切换、论文 BibTeX 复制。",
    tech: ["Next.js", "TypeScript", "Tailwind"],
    repoUrl: "https://github.com/xuyu3hen/person",
    featured: true,
  },
  {
    name: "Research Notes",
    description: "科研学习与工程实践的笔记与实验记录（建议独立仓库维护）。",
    tech: ["Markdown", "Obsidian", "GitHub Pages"],
    repoUrl: "https://github.com/xuyu3hen",
    featured: true,
  },
  {
    name: "Toolbox",
    description: "个人常用脚手架与自动化脚本集合：让项目初始化、发布与维护更省心。",
    tech: ["Node.js", "TypeScript", "CI/CD"],
    repoUrl: "https://github.com/xuyu3hen",
  },
];

export const site = {
  name: "徐煜辰",
  title: "Research Engineer · Full-Stack Developer",
  tagline: "科研与工程交叉：可复现、可观测、可维护。",
  intro:
    "关注 ML Systems / Developer Tooling / Web 可视化等交叉方向，偏好把研究与工程问题拆成可度量指标与可复现流程，并将想法快速落地为可交付的原型与产品。",
  location: "China",
  timezone: "UTC+8",
  email: "yu3hen@126.com",
  cvUrl: "/cv.txt",
  socials: [
    { label: "GitHub", href: "https://github.com/xuyu3hen" },
    { label: "Google Scholar", href: "" },
    { label: "LinkedIn", href: "" },
    { label: "ORCID", href: "" },
  ] satisfies SocialLink[],
  researchAreas: [
    {
      title: "Developer Tooling",
      keywords: ["DX", "automation", "docs"],
      description:
        "面向个人与团队效率的工具与工作流：模板化、自动化、结构化知识管理，让产出更可持续。",
    },
    {
      title: "ML Systems",
      keywords: ["latency", "serving", "observability"],
      description:
        "关注推理链路性能与可观测性：让系统更稳定、成本更可控，同时保留对实验与评测的透明度。",
    },
    {
      title: "Web for Research",
      keywords: ["visualization", "SSG", "UX"],
      description:
        "用极简信息架构与高性能前端展示研究/项目/成果，让内容可检索、可链接、可持续更新。",
    },
  ] satisfies ResearchArea[],
  projects,
  publications: [
    {
      year: 2025,
      title: "A Reproducible Protocol for Tool-Using Agent Evaluation",
      authors: "Yuchen Xu, Coauthor A, Coauthor B",
      venue: "NeurIPS (Workshop)",
      doiUrl: "https://doi.org/10.0000/example",
      pdfUrl: "https://arxiv.org/pdf/0000.00000.pdf",
      codeUrl: "https://github.com/xuyu3hen",
      bibtex:
        "@inproceedings{xu2025agenteval,\n  title={A Reproducible Protocol for Tool-Using Agent Evaluation},\n  author={Yuchen Xu and Coauthor A and Coauthor B},\n  booktitle={NeurIPS Workshop},\n  year={2025},\n  url={https://arxiv.org/abs/0000.00000}\n}",
    },
    {
      year: 2024,
      title: "Observability-First Serving for Efficient LLM Inference",
      authors: "Yuchen Xu, Coauthor C",
      venue: "arXiv",
      pdfUrl: "https://arxiv.org/pdf/0000.00000.pdf",
      bibtex:
        "@article{xu2024observability,\n  title={Observability-First Serving for Efficient LLM Inference},\n  author={Yuchen Xu and Coauthor C},\n  journal={arXiv preprint arXiv:0000.00000},\n  year={2024}\n}",
    },
  ] satisfies Publication[],
  experience: [
    {
      org: "Your University (Example)",
      role: "Research Student",
      time: "2022 — Present",
      bullets: [
        "提出并实现可复现实验流水线，缩短评测迭代时间。",
        "在工具调用与检索增强方向进行系统性误差分析。",
      ],
    },
    {
      org: "Your Company (Example)",
      role: "Software Engineer",
      time: "2019 — 2022",
      bullets: [
        "负责在线推理服务的性能与可靠性优化。",
        "落地可观测性体系，提升故障定位效率。",
      ],
    },
  ] satisfies TimelineItem[],
  awards: [
    { year: 2025, title: "Best Paper Award (Workshop)", note: "(Example)" },
    { year: 2023, title: "Outstanding Graduate Scholarship" },
  ] satisfies AwardOrTalk[],
  talks: [
    {
      year: 2025,
      title: "Tool-Using Agents: Evaluation & Engineering",
      note: "Invited Talk",
      link: "https://example.com/slides",
    },
  ] satisfies AwardOrTalk[],
};

export const nav = [
  { id: "home", label: "首页" },
  { id: "about", label: "关于我" },
  { id: "research", label: "研究方向" },
  { id: "publications", label: "学术成果" },
  { id: "projects", label: "开源项目" },
  { id: "contact", label: "联系方式" },
] as const;

