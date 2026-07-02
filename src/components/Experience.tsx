import type { SiteContent } from "@/lib/site-content";

import { SectionHeader } from "./SectionHeader";

export function Experience({ siteContent }: { siteContent: SiteContent }) {
  return (
    <section id="experience" className="section">
      <div className="container py-14">
        <SectionHeader
          eyebrow="Experience"
          title="履历与经历"
          description={siteContent.experienceSection.description}
        />

        <div className="mt-8 grid grid-cols-1 gap-5">
          {siteContent.experience.map((item) => (
            <div
              key={`${item.org}-${item.time}`}
              className="card relative overflow-hidden p-6 grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_52%,transparent),transparent)] opacity-70"
              />
              <div className="text-sm text-[color:var(--muted)]">{item.time}</div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-base font-semibold tracking-tight">
                    {item.role}
                  </div>
                  <div className="text-sm text-[color:var(--muted)]">{item.org}</div>
                </div>
                <ul className="ml-4 list-disc text-[14px] leading-7 text-[color:var(--muted)]">
                  {item.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card p-6">
            <div className="text-sm font-semibold tracking-tight">
              {siteContent.experienceSection.awardsTitle}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {siteContent.awards.map((a) => (
                <div
                  key={`${a.year}-${a.title}`}
                  className="panelInset flex items-start justify-between gap-3 rounded-2xl p-4"
                >
                  <div className="flex flex-col gap-1">
                    <div className="text-sm">{a.title}</div>
                    {a.note ? (
                      <div className="text-xs text-[color:var(--muted)]">
                        {a.note}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-xs text-[color:var(--muted)]">{a.year}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold tracking-tight">
              {siteContent.experienceSection.talksTitle}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {siteContent.talks.map((t) => (
                <div
                  key={`${t.year}-${t.title}`}
                  className="panelInset flex items-start justify-between gap-3 rounded-2xl p-4"
                >
                  <div className="flex flex-col gap-1">
                    <div className="text-sm">{t.title}</div>
                    {t.note ? (
                      <div className="text-xs text-[color:var(--muted)]">
                        {t.note}
                      </div>
                    ) : null}
                    {t.link ? (
                      <a
                        className="mt-1 text-xs text-[color:var(--accent)]"
                        href={t.link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Slides / Video
                      </a>
                    ) : null}
                  </div>
                  <div className="text-xs text-[color:var(--muted)]">{t.year}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

