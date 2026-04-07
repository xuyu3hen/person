import { ArrowUpRight } from "lucide-react";

import { site } from "@/lib/site-data";

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
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-base font-semibold tracking-tight">
            {props.name}
          </div>
          <div className="text-[14px] leading-6 text-[color:var(--muted)]">
            {props.description}
          </div>
        </div>
        {props.featured ? (
          <div className="rounded-full border border-[color:color-mix(in_srgb,var(--accent)_40%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1 text-xs">
            Featured
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {props.tech.map((t) => (
          <span
            key={t}
            className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] px-3 py-1 text-xs font-mono text-[color:var(--muted)]"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
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
  );
}

export function Projects() {
  const projects = [...site.projects].sort((a, b) => {
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
          description="精选项目卡片，包含技术栈与 Repo / Demo 入口。"
        />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="text-xs text-[color:var(--muted)]">
            更多项目可在 GitHub 查看。
          </div>
          <a
            className="button"
            href={site.socials.find((x) => x.label === "GitHub")?.href}
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

