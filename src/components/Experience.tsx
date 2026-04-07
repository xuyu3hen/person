import { site } from "@/lib/site-data";

import { SectionHeader } from "./SectionHeader";

export function Experience() {
  return (
    <section id="experience" className="section">
      <div className="container py-14">
        <SectionHeader
          eyebrow="Experience"
          title="履历与经历"
          description="用时间线方式呈现教育、工作与研究经历。"
        />

        <div className="mt-8 grid grid-cols-1 gap-4">
          {site.experience.map((item) => (
            <div
              key={`${item.org}-${item.time}`}
              className="card p-5 grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]"
            >
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

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="text-sm font-semibold tracking-tight">荣誉</div>
            <div className="mt-3 flex flex-col gap-2">
              {site.awards.map((a) => (
                <div
                  key={`${a.year}-${a.title}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] p-4"
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
          <div className="card p-5">
            <div className="text-sm font-semibold tracking-tight">报告</div>
            <div className="mt-3 flex flex-col gap-2">
              {site.talks.map((t) => (
                <div
                  key={`${t.year}-${t.title}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] p-4"
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

