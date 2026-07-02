import { ArrowUpRight } from "lucide-react";

import type { SiteContent } from "@/lib/site-content";

import { SectionHeader } from "./SectionHeader";

function ProjectCard(props: {
  name: string;
  description: string;
  tech: string[];
  repoUrl: string;
  demoUrl?: string;
  featured?: boolean;
}) {
  return (
    <div className="card group relative overflow-hidden p-6 flex flex-col gap-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_58%,transparent),transparent)] opacity-70"
      />
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-base font-semibold tracking-tight sm:text-[17px]">
            {props.name}
          </div>
          <div className="text-[14px] leading-6 text-[color:var(--muted)]">
            {props.description}
          </div>
        </div>
        {props.featured ? (
          <div className="rounded-full border border-[color:color-mix(in_srgb,var(--accent)_34%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1 text-xs font-medium text-[color:var(--text)]">
            Featured
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {props.tech.map((t) => (
          <span
            key={t}
            className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_100%,transparent)] px-3 py-1 text-xs font-mono text-[color:var(--muted)]"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="panelInset mt-auto rounded-2xl p-3">
        <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
          Links
        </div>
        <div className="flex flex-wrap gap-2">
        <a
          className="button"
          href={props.repoUrl}
          target="_blank"
          rel="noreferrer"
        >
          <ArrowUpRight size={16} />
          <span className="text-sm">Repo</span>
        </a>
        {props.demoUrl ? (
          <a
            className="button buttonPrimary"
            href={props.demoUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ArrowUpRight size={16} />
            <span className="text-sm">Demo</span>
          </a>
        ) : null}
        </div>
      </div>
    </div>
  );
}

export function Projects({ siteContent }: { siteContent: SiteContent }) {
  const projects = [...siteContent.projects].sort((a, b) => {
    const fa = a.featured ? 1 : 0;
    const fb = b.featured ? 1 : 0;
    return fb - fa;
  });

  return (
    <section id="projects" className="section">
      <div className="container py-14">
        <SectionHeader
          eyebrow="Projects"
          title="开源项目"
          description={siteContent.projectsSection.description}
        />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.name}
              name={p.name}
              description={p.description}
              tech={p.tech}
              repoUrl={p.repoUrl}
              demoUrl={p.demoUrl}
              featured={p.featured}
            />
          ))}
        </div>
        <div className="panelInset mt-8 flex items-center justify-between gap-4 rounded-[22px] px-5 py-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {siteContent.projectsSection.ctaText}
          </div>
          <a
            className="button"
            href={siteContent.socials.find((x) => x.label === "GitHub")?.href}
            target="_blank"
            rel="noreferrer"
          >
            <ArrowUpRight size={16} />
            <span className="text-sm">GitHub</span>
          </a>
        </div>
      </div>
    </section>
  );
}

