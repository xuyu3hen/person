import { ArrowUpRight, Download, Mail } from "lucide-react";

import { site } from "@/lib/site-data";

export function Hero() {
  const github = site.socials.find((x) => x.label === "GitHub")?.href ?? "#";
  const scholar =
    site.socials.find((x) => x.label === "Google Scholar")?.href ?? "#";

  return (
    <section id="home" className="section">
      <div className="container pt-16 pb-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--muted)]">
                {site.title}
              </div>
              <h1 className="text-[40px] leading-[1.08] font-semibold tracking-tight">
                {site.name}
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 text-[color:var(--muted)]">
                {site.intro}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <a
                  className="button buttonPrimary"
                  href={github}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowUpRight size={16} />
                  <span className="text-sm">GitHub</span>
                </a>
                <a
                  className="button"
                  href={scholar}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ArrowUpRight size={16} />
                  <span className="text-sm">Scholar</span>
                </a>
                <a className="button" href={`mailto:${site.email}`}>
                  <Mail size={16} />
                  <span className="text-sm">Email</span>
                </a>
                <a className="button" href={site.cvUrl}>
                  <Download size={16} />
                  <span className="text-sm">简历</span>
                </a>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[color:var(--muted)]">
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                  {site.location}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1">
                  {site.timezone}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1">
                  {site.tagline}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold tracking-tight">
                Research Snapshot
              </div>
              <div className="text-xs text-[color:var(--muted)]">Now</div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] p-4">
                <div className="text-xs font-semibold tracking-[0.12em] uppercase text-[color:var(--muted)]">
                  Focus
                </div>
                <div className="mt-2 text-sm leading-6">
                  LLM Agents · Reproducible Evaluation · ML Systems
                </div>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] p-4">
                <div className="text-xs font-semibold tracking-[0.12em] uppercase text-[color:var(--muted)]">
                  Principle
                </div>
                <div className="mt-2 text-sm leading-6">
                  Clear metrics, clean code, minimal abstractions.
                </div>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] p-4">
                <div className="text-xs font-semibold tracking-[0.12em] uppercase text-[color:var(--muted)]">
                  Availability
                </div>
                <div className="mt-2 text-sm leading-6">
                  Open to collaborations and research engineering roles.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

