import type { SectionId } from "./sections";
import { isSectionId } from "./sections";
import type {
  AwardOrTalk,
  Project,
  Publication,
  ResearchArea,
  SocialLink,
  TimelineItem,
} from "./site-data";
import { nav as defaultNav, site } from "./site-data";
import { ensureSchema, getSql } from "./db";

export type SiteNavItem = {
  id: SectionId;
  label: string;
};

export type HeroMetric = {
  label: string;
  value: string;
};

export type HeroContent = {
  description: string;
  badgeLabel: string;
  carouselTexts: string[];
  focus: HeroMetric;
  mode: HeroMetric;
  stack: HeroMetric;
};

export type AboutContent = {
  description: string;
  systemLabel: string;
  tags: string[];
  mbti: string;
  mbtiLabel: string;
};

export type ResearchStat = {
  label: string;
  value: number;
};

export type ResearchSectionContent = {
  description: string;
  stats: ResearchStat[];
  methodologyTitle: string;
  methodologyDescription: string;
  methodologyTags: string[];
};

export type ProjectsSectionContent = {
  description: string;
  ctaText: string;
};

export type ExperienceSectionContent = {
  description: string;
  awardsTitle: string;
  talksTitle: string;
};

export type ContactSectionContent = {
  description: string;
};

export type FooterContent = {
  description: string;
  sourceUrl: string;
};

export type SiteProfile = {
  name: string;
  title: string;
  tagline: string;
  intro: string;
  location: string;
  timezone: string;
  email: string;
  cvUrl: string;
};

export type SiteContent = {
  profile: SiteProfile;
  nav: SiteNavItem[];
  socials: SocialLink[];
  hero: HeroContent;
  about: AboutContent;
  researchSection: ResearchSectionContent;
  researchAreas: ResearchArea[];
  projectsSection: ProjectsSectionContent;
  projects: Project[];
  experienceSection: ExperienceSectionContent;
  experience: TimelineItem[];
  awards: AwardOrTalk[];
  talks: AwardOrTalk[];
  publications: Publication[];
  contactSection: ContactSectionContent;
  footer: FooterContent;
};

export type SiteContentRecord = {
  content: SiteContent;
  updatedAt: string | null;
};

const SITE_CONTENT_KEY = "site_content";

export const defaultSiteContent: SiteContent = {
  profile: {
    name: site.name,
    title: site.title,
    tagline: site.tagline,
    intro: site.intro,
    location: site.location,
    timezone: site.timezone,
    email: site.email,
    cvUrl: site.cvUrl,
  },
  nav: defaultNav.map((item) => ({
    id: item.id,
    label: item.label,
  })),
  socials: [...site.socials],
  hero: {
    description:
      "用工程化方式整理生活、知识与长期目标，把研究、开发和个人系统做成一个持续迭代的产品。",
    badgeLabel: "Personal Operating System",
    carouselTexts: [
      "Stay hungry, stay foolish.",
      "求知若饥，虚心若愚。",
      "今天也要认真生活。",
      "简单 · 规律 · 可持续。",
    ],
    focus: {
      label: "Focus",
      value: "Research x Full-Stack",
    },
    mode: {
      label: "Mode",
      value: "Build in Public, Think in Systems",
    },
    stack: {
      label: "Stack",
      value: "Next.js · TS · AI Tools",
    },
  },
  about: {
    description: "简洁陈述你的研究取向、工程能力与合作偏好。",
    systemLabel: "System Mindset",
    tags: ["Reproducibility", "Minimalism", "Observability", "Systems"],
    mbti: "INTJ",
    mbtiLabel: "Architect · 建筑师",
  },
  researchSection: {
    description: "像产品路线图一样展示我持续投入的问题域、方法论和实现路径。",
    stats: [
      { label: "前端", value: 78 },
      { label: "后端", value: 72 },
      { label: "AI/算法", value: 80 },
      { label: "科研工具", value: 85 },
    ],
    methodologyTitle: "方法论",
    methodologyDescription:
      "我偏好将问题拆成“可测指标 + 可复现实验 + 可维护实现”，并优先构建可观测性与失败分析工具链，让结果可解释、迭代可控。",
    methodologyTags: [
      "Benchmarks",
      "Ablations",
      "Tracing",
      "Profiling",
      "Experiment Logs",
    ],
  },
  researchAreas: [...site.researchAreas],
  projectsSection: {
    description: "精选项目卡片，包含技术栈与 Repo / Demo 入口。",
    ctaText: "更多项目可在 GitHub 查看。",
  },
  projects: [...site.projects],
  experienceSection: {
    description:
      "按时间线组织我的研究、工程和成长轨迹，强调长期投入而不是一次性展示。",
    awardsTitle: "荣誉",
    talksTitle: "报告",
  },
  experience: [...site.experience],
  awards: [...site.awards],
  talks: [...site.talks],
  publications: [...site.publications],
  contactSection: {
    description: "像产品 landing page 的结尾一样，给出最直接的联系入口和可信的身份链接。",
  },
  footer: {
    description: "Build quietly. Think deeply. Iterate daily.",
    sourceUrl: "https://github.com/xuyu3hen/person",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOrFallback(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArrayOrFallback(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeNavItems(value: unknown): SiteNavItem[] {
  if (!Array.isArray(value)) return defaultSiteContent.nav;
  const seen = new Set<SectionId>();
  const items = value
    .map((item) => {
      const row = isRecord(item) ? item : {};
      const id = stringOrFallback(row.id);
      if (!isSectionId(id) || seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        label: stringOrFallback(row.label, id),
      };
    })
    .filter((item): item is SiteNavItem => item !== null);
  return items.length ? items : defaultSiteContent.nav;
}

function normalizeSocials(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return defaultSiteContent.socials;
  return value.map((item, index) => {
    const fallback = defaultSiteContent.socials[index] ?? { label: "", href: "" };
    const row = isRecord(item) ? item : {};
    return {
      label: stringOrFallback(row.label, fallback.label),
      href: stringOrFallback(row.href, fallback.href),
    };
  });
}

function normalizeResearchAreas(value: unknown): ResearchArea[] {
  if (!Array.isArray(value)) return defaultSiteContent.researchAreas;
  return value.map((item, index) => {
    const fallback = defaultSiteContent.researchAreas[index] ?? {
      title: "",
      keywords: [],
      description: "",
    };
    const row = isRecord(item) ? item : {};
    return {
      title: stringOrFallback(row.title, fallback.title),
      keywords: stringArrayOrFallback(row.keywords, fallback.keywords),
      description: stringOrFallback(row.description, fallback.description),
    };
  });
}

function normalizeProjects(value: unknown): Project[] {
  if (!Array.isArray(value)) return defaultSiteContent.projects;
  return value.map((item, index) => {
    const fallback = defaultSiteContent.projects[index] ?? {
      name: "",
      description: "",
      tech: [],
      repoUrl: "",
      demoUrl: "",
      featured: false,
    };
    const row = isRecord(item) ? item : {};
    return {
      name: stringOrFallback(row.name, fallback.name),
      description: stringOrFallback(row.description, fallback.description),
      tech: stringArrayOrFallback(row.tech, fallback.tech),
      repoUrl: stringOrFallback(row.repoUrl, fallback.repoUrl),
      demoUrl: stringOrFallback(row.demoUrl, fallback.demoUrl),
      featured: row.featured === true,
    };
  });
}

function normalizeTimelineItems(value: unknown): TimelineItem[] {
  if (!Array.isArray(value)) return defaultSiteContent.experience;
  return value.map((item, index) => {
    const fallback = defaultSiteContent.experience[index] ?? {
      org: "",
      role: "",
      time: "",
      bullets: [],
    };
    const row = isRecord(item) ? item : {};
    return {
      org: stringOrFallback(row.org, fallback.org),
      role: stringOrFallback(row.role, fallback.role),
      time: stringOrFallback(row.time, fallback.time),
      bullets: stringArrayOrFallback(row.bullets, fallback.bullets),
    };
  });
}

function normalizeAwardsOrTalks(value: unknown, fallbackItems: AwardOrTalk[]): AwardOrTalk[] {
  if (!Array.isArray(value)) return fallbackItems;
  return value.map((item, index) => {
    const fallback = fallbackItems[index] ?? {
      year: new Date().getFullYear(),
      title: "",
      note: "",
      link: "",
    };
    const row = isRecord(item) ? item : {};
    const year =
      typeof row.year === "number" && Number.isFinite(row.year)
        ? row.year
        : fallback.year;
    return {
      year,
      title: stringOrFallback(row.title, fallback.title),
      note: stringOrFallback(row.note, fallback.note ?? ""),
      link: stringOrFallback(row.link, fallback.link ?? ""),
    };
  });
}

function normalizePublications(value: unknown): Publication[] {
  if (!Array.isArray(value)) return defaultSiteContent.publications;
  return value.map((item, index) => {
    const fallback = defaultSiteContent.publications[index] ?? {
      year: new Date().getFullYear(),
      title: "",
      authors: "",
      venue: "",
    };
    const row = isRecord(item) ? item : {};
    return {
      year:
        typeof row.year === "number" && Number.isFinite(row.year)
          ? row.year
          : fallback.year,
      title: stringOrFallback(row.title, fallback.title),
      authors: stringOrFallback(row.authors, fallback.authors),
      venue: stringOrFallback(row.venue, fallback.venue),
      doiUrl: stringOrFallback(row.doiUrl, fallback.doiUrl ?? ""),
      pdfUrl: stringOrFallback(row.pdfUrl, fallback.pdfUrl ?? ""),
      codeUrl: stringOrFallback(row.codeUrl, fallback.codeUrl ?? ""),
      bibtex: stringOrFallback(row.bibtex, fallback.bibtex ?? ""),
    };
  });
}

function normalizeResearchStats(value: unknown): ResearchStat[] {
  if (!Array.isArray(value)) return defaultSiteContent.researchSection.stats;
  return value.map((item, index) => {
    const fallback = defaultSiteContent.researchSection.stats[index] ?? {
      label: "",
      value: 0,
    };
    const row = isRecord(item) ? item : {};
    return {
      label: stringOrFallback(row.label, fallback.label),
      value:
        typeof row.value === "number" && Number.isFinite(row.value)
          ? Math.max(0, Math.min(100, row.value))
          : fallback.value,
    };
  });
}

function normalizeHeroMetric(value: unknown, fallback: HeroMetric): HeroMetric {
  const row = isRecord(value) ? value : {};
  return {
    label: stringOrFallback(row.label, fallback.label),
    value: stringOrFallback(row.value, fallback.value),
  };
}

export function normalizeSiteContent(value: unknown): SiteContent {
  const row = isRecord(value) ? value : {};
  const profile = isRecord(row.profile) ? row.profile : {};
  const hero = isRecord(row.hero) ? row.hero : {};
  const about = isRecord(row.about) ? row.about : {};
  const researchSection = isRecord(row.researchSection) ? row.researchSection : {};
  const projectsSection = isRecord(row.projectsSection) ? row.projectsSection : {};
  const experienceSection = isRecord(row.experienceSection) ? row.experienceSection : {};
  const contactSection = isRecord(row.contactSection) ? row.contactSection : {};
  const footer = isRecord(row.footer) ? row.footer : {};

  return {
    profile: {
      name: stringOrFallback(profile.name, defaultSiteContent.profile.name),
      title: stringOrFallback(profile.title, defaultSiteContent.profile.title),
      tagline: stringOrFallback(profile.tagline, defaultSiteContent.profile.tagline),
      intro: stringOrFallback(profile.intro, defaultSiteContent.profile.intro),
      location: stringOrFallback(profile.location, defaultSiteContent.profile.location),
      timezone: stringOrFallback(profile.timezone, defaultSiteContent.profile.timezone),
      email: stringOrFallback(profile.email, defaultSiteContent.profile.email),
      cvUrl: stringOrFallback(profile.cvUrl, defaultSiteContent.profile.cvUrl),
    },
    nav: normalizeNavItems(row.nav),
    socials: normalizeSocials(row.socials),
    hero: {
      description: stringOrFallback(hero.description, defaultSiteContent.hero.description),
      badgeLabel: stringOrFallback(hero.badgeLabel, defaultSiteContent.hero.badgeLabel),
      carouselTexts: stringArrayOrFallback(
        hero.carouselTexts,
        defaultSiteContent.hero.carouselTexts
      ),
      focus: normalizeHeroMetric(hero.focus, defaultSiteContent.hero.focus),
      mode: normalizeHeroMetric(hero.mode, defaultSiteContent.hero.mode),
      stack: normalizeHeroMetric(hero.stack, defaultSiteContent.hero.stack),
    },
    about: {
      description: stringOrFallback(about.description, defaultSiteContent.about.description),
      systemLabel: stringOrFallback(about.systemLabel, defaultSiteContent.about.systemLabel),
      tags: stringArrayOrFallback(about.tags, defaultSiteContent.about.tags),
      mbti: stringOrFallback(about.mbti, defaultSiteContent.about.mbti),
      mbtiLabel: stringOrFallback(about.mbtiLabel, defaultSiteContent.about.mbtiLabel),
    },
    researchSection: {
      description: stringOrFallback(
        researchSection.description,
        defaultSiteContent.researchSection.description
      ),
      stats: normalizeResearchStats(researchSection.stats),
      methodologyTitle: stringOrFallback(
        researchSection.methodologyTitle,
        defaultSiteContent.researchSection.methodologyTitle
      ),
      methodologyDescription: stringOrFallback(
        researchSection.methodologyDescription,
        defaultSiteContent.researchSection.methodologyDescription
      ),
      methodologyTags: stringArrayOrFallback(
        researchSection.methodologyTags,
        defaultSiteContent.researchSection.methodologyTags
      ),
    },
    researchAreas: normalizeResearchAreas(row.researchAreas),
    projectsSection: {
      description: stringOrFallback(
        projectsSection.description,
        defaultSiteContent.projectsSection.description
      ),
      ctaText: stringOrFallback(
        projectsSection.ctaText,
        defaultSiteContent.projectsSection.ctaText
      ),
    },
    projects: normalizeProjects(row.projects),
    experienceSection: {
      description: stringOrFallback(
        experienceSection.description,
        defaultSiteContent.experienceSection.description
      ),
      awardsTitle: stringOrFallback(
        experienceSection.awardsTitle,
        defaultSiteContent.experienceSection.awardsTitle
      ),
      talksTitle: stringOrFallback(
        experienceSection.talksTitle,
        defaultSiteContent.experienceSection.talksTitle
      ),
    },
    experience: normalizeTimelineItems(row.experience),
    awards: normalizeAwardsOrTalks(row.awards, defaultSiteContent.awards),
    talks: normalizeAwardsOrTalks(row.talks, defaultSiteContent.talks),
    publications: normalizePublications(row.publications),
    contactSection: {
      description: stringOrFallback(
        contactSection.description,
        defaultSiteContent.contactSection.description
      ),
    },
    footer: {
      description: stringOrFallback(footer.description, defaultSiteContent.footer.description),
      sourceUrl: stringOrFallback(footer.sourceUrl, defaultSiteContent.footer.sourceUrl),
    },
  };
}

async function ensureSiteContentSeeded() {
  const sql = getSql();
  await sql`
    INSERT INTO journal_site_content (key, value, updated_at)
    VALUES (
      ${SITE_CONTENT_KEY},
      ${JSON.stringify(defaultSiteContent)}::jsonb,
      NOW()
    )
    ON CONFLICT (key) DO NOTHING;
  `;
}

export async function getSiteContent(): Promise<SiteContentRecord> {
  await ensureSchema();
  await ensureSiteContentSeeded();
  const sql = getSql();
  const result = await sql`
    SELECT value, updated_at
    FROM journal_site_content
    WHERE key = ${SITE_CONTENT_KEY}
    LIMIT 1;
  `;

  if (!result.rows[0]) {
    return {
      content: defaultSiteContent,
      updatedAt: null,
    };
  }

  const row = result.rows[0] as Record<string, unknown>;
  return {
    content: normalizeSiteContent(row.value),
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : null,
  };
}

export async function getSiteContentSafe(): Promise<SiteContentRecord> {
  try {
    return await getSiteContent();
  } catch {
    return {
      content: defaultSiteContent,
      updatedAt: null,
    };
  }
}

export async function saveSiteContent(value: unknown): Promise<SiteContentRecord> {
  await ensureSchema();
  const sql = getSql();
  const content = normalizeSiteContent(value);
  const result = await sql`
    INSERT INTO journal_site_content (key, value, updated_at)
    VALUES (
      ${SITE_CONTENT_KEY},
      ${JSON.stringify(content)}::jsonb,
      NOW()
    )
    ON CONFLICT (key)
    DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at
    RETURNING updated_at;
  `;
  const row = result.rows[0] as Record<string, unknown>;
  return {
    content,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).toISOString() : null,
  };
}
