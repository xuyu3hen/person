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

export const site = {
  name: "你的姓名",
  title: "Research Engineer · Developer",
  tagline: "把科研问题工程化，把工程系统学术化。",
  intro:
    "关注 ML Systems / NLP / LLM Agent 的可复现评测与工程落地，擅长将研究想法转化为可维护的生产级原型。",
  location: "City, Country",
  timezone: "UTC+8",
  email: "you@example.com",
  cvUrl: "/cv.txt",
  socials: [
    { label: "GitHub", href: "https://github.com/yourname" },
    { label: "Google Scholar", href: "https://scholar.google.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com" },
    { label: "ORCID", href: "https://orcid.org" },
  ] satisfies SocialLink[],
  researchAreas: [
    {
      title: "LLM Agent Evaluation",
      keywords: ["agents", "benchmarks", "reproducibility"],
      description:
        "构建可复现的评测协议与指标，分析工具调用、记忆与规划策略对效果的影响。",
    },
    {
      title: "ML Systems",
      keywords: ["latency", "serving", "observability"],
      description: "优化推理链路与系统可观测性，追求更稳定的延迟与更低成本。",
    },
    {
      title: "NLP for Science",
      keywords: ["information extraction", "retrieval", "tooling"],
      description: "将信息抽取与检索增强用于科研知识管理与自动化工作流。",
    },
  ] satisfies ResearchArea[],
  projects: [
    {
      name: "PaperTrace",
      description: "一个面向科研写作的引用追踪与 BibTeX 管理工具原型。",
      tech: ["TypeScript", "Next.js", "Tailwind"],
      repoUrl: "https://github.com/yourname/papertrace",
      demoUrl: "https://example.com",
      featured: true,
    },
    {
      name: "AgentEval Kit",
      description: "轻量化工具调用评测框架，支持多轮对话与可复现实验配置。",
      tech: ["Python", "PyTorch", "Hydra"],
      repoUrl: "https://github.com/yourname/agenteval-kit",
      featured: true,
    },
    {
      name: "Latency Lab",
      description: "推理服务延迟分析与火焰图可视化脚手架。",
      tech: ["Rust", "OpenTelemetry"],
      repoUrl: "https://github.com/yourname/latency-lab",
    },
  ] satisfies Project[],
  publications: [
    {
      year: 2025,
      title: "A Reproducible Protocol for Tool-Using Agent Evaluation",
      authors: "Your Name, Coauthor A, Coauthor B",
      venue: "NeurIPS (Workshop)",
      doiUrl: "https://doi.org/10.0000/example",
      pdfUrl: "https://arxiv.org/pdf/0000.00000.pdf",
      codeUrl: "https://github.com/yourname/agenteval-kit",
      bibtex:
        "@inproceedings{yourname2025agenteval,\n  title={A Reproducible Protocol for Tool-Using Agent Evaluation},\n  author={Your Name and Coauthor A and Coauthor B},\n  booktitle={NeurIPS Workshop},\n  year={2025},\n  url={https://arxiv.org/abs/0000.00000}\n}",
    },
    {
      year: 2024,
      title: "Observability-First Serving for Efficient LLM Inference",
      authors: "Your Name, Coauthor C",
      venue: "arXiv",
      pdfUrl: "https://arxiv.org/pdf/0000.00000.pdf",
      bibtex:
        "@article{yourname2024observability,\n  title={Observability-First Serving for Efficient LLM Inference},\n  author={Your Name and Coauthor C},\n  journal={arXiv preprint arXiv:0000.00000},\n  year={2024}\n}",
    },
  ] satisfies Publication[],
  experience: [
    {
      org: "Your University",
      role: "Ph.D. Candidate / Research Assistant",
      time: "2022 — Present",
      bullets: [
        "提出并实现可复现实验流水线，缩短评测迭代时间。",
        "在工具调用与检索增强方向进行系统性误差分析。",
      ],
    },
    {
      org: "Your Company",
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

