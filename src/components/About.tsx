import { SectionHeader } from "./SectionHeader";

import type { SiteContent } from "@/lib/site-content";

function MBTIBadge({ mbti, mbtiLabel }: { mbti: string; mbtiLabel: string }) {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
  ];
  const letters = mbti
    .trim()
    .slice(0, 4)
    .split("")
    .map((char, index) => ({
      char,
      gradient: gradients[index % gradients.length],
    }));

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1">
        {letters.map((l, i) => (
          <div
            key={l.char}
            className="relative group cursor-default"
            title={mbtiLabel}
          >
            <div
              className={`w-12 h-14 rounded-xl bg-gradient-to-br ${l.gradient} flex items-center justify-center shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl`}
              style={{
                transform: `rotate(${(i - 1.5) * 2}deg)`,
              }}
            >
              <span className="text-xl font-extrabold text-white tracking-tight drop-shadow-sm">
                {l.char}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold tracking-[0.12em] text-[color:var(--text)]">
          {mbti}
        </span>
        <span className="text-[10px] text-[color:var(--muted)]">
          {mbtiLabel}
        </span>
      </div>
    </div>
  );
}

export function About({ siteContent }: { siteContent: SiteContent }) {
  return (
    <section id="about" className="section">
      <div className="container py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeader
            eyebrow="About"
            title="关于我"
            description={siteContent.about.description}
          />

          <div className="card relative overflow-hidden p-6 lg:p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_58%,transparent),transparent)] opacity-70"
            />
            <div className="mb-6 flex items-center justify-between gap-4">
              <MBTIBadge
                mbti={siteContent.about.mbti}
                mbtiLabel={siteContent.about.mbtiLabel}
              />
              <div className="sectionEyebrow">{siteContent.about.systemLabel}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {siteContent.about.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_100%,transparent)] px-3 py-1 text-xs text-[color:var(--muted)]"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="panelInset rounded-2xl p-4">
                <div className="text-xs font-semibold tracking-[0.16em] uppercase text-[color:var(--muted)]">
                  Email
                </div>
                <div className="mt-2 text-sm break-all">
                  {siteContent.profile.email}
                </div>
              </div>
              <div className="panelInset rounded-2xl p-4">
                <div className="text-xs font-semibold tracking-[0.16em] uppercase text-[color:var(--muted)]">
                  Location
                </div>
                <div className="mt-2 text-sm">{siteContent.profile.location}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

