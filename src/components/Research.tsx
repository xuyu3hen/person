import { SectionHeader } from "./SectionHeader";

import type { SiteContent } from "@/lib/site-content";

export function Research({ siteContent }: { siteContent: SiteContent }) {
  return (
    <section id="research" className="section">
      <div className="container py-14">
        <SectionHeader
          eyebrow="Research"
          title="研究方向"
          description={siteContent.researchSection.description}
        />

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {siteContent.researchAreas.map((r) => (
            <div key={r.title} className="card relative overflow-hidden p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_55%,transparent),transparent)] opacity-70"
              />
              <div className="flex flex-col gap-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Research Track
                </div>
                <div className="text-base font-semibold tracking-tight">
                  {r.title}
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_100%,transparent)] px-3 py-1 text-xs font-mono text-[color:var(--muted)]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <p className="text-[14px] leading-6 text-[color:var(--muted)]">
                  {r.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card p-6">
            <div className="text-sm font-semibold tracking-tight">
              技术栈 / 工具
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {siteContent.researchSection.stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{s.label}</div>
                    <div className="text-xs text-[color:var(--muted)]">
                      {s.value}%
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[color:color-mix(in_srgb,var(--panel)_80%,transparent)] border border-[color:var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_75%,white),color-mix(in_srgb,var(--accent-strong)_85%,black))]"
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold tracking-tight">
              {siteContent.researchSection.methodologyTitle}
            </div>
            <div className="mt-4 text-[14px] leading-7 text-[color:var(--muted)]">
              {siteContent.researchSection.methodologyDescription}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {siteContent.researchSection.methodologyTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs text-[color:var(--muted)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

