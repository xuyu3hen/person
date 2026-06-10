import { SectionHeader } from "./SectionHeader";

import { site } from "@/lib/site-data";

function MBTIBadge() {
  const letters = [
    { char: "I", label: "Introvert", desc: "内向", gradient: "from-violet-500 to-purple-600" },
    { char: "N", label: "Intuitive", desc: "直觉", gradient: "from-blue-500 to-cyan-500" },
    { char: "T", label: "Thinking", desc: "思考", gradient: "from-emerald-500 to-teal-500" },
    { char: "J", label: "Judging", desc: "判断", gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1">
        {letters.map((l, i) => (
          <div
            key={l.char}
            className="relative group cursor-default"
            title={`${l.label} · ${l.desc}`}
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
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[9px] text-[color:var(--muted)] whitespace-nowrap">
                {l.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold tracking-[0.12em] text-[color:var(--text)]">
          INTJ
        </span>
        <span className="text-[10px] text-[color:var(--muted)]">
          Architect · 建筑师
        </span>
      </div>
    </div>
  );
}

export function About() {
  return (
    <section id="about" className="section">
      <div className="container py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeader
            eyebrow="About"
            title="关于我"
            description="简洁陈述你的研究取向、工程能力与合作偏好。"
          />

          <div className="card p-5 lg:p-6">
            <div className="mb-5">
              <MBTIBadge />
            </div>
            <div className="flex flex-wrap gap-2">
              {["Reproducibility", "Minimalism", "Observability", "Systems"].map(
                (t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs text-[color:var(--muted)]"
                  >
                    {t}
                  </span>
                )
              )}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] p-4">
                <div className="text-xs font-semibold tracking-[0.12em] uppercase text-[color:var(--muted)]">
                  Email
                </div>
                <div className="mt-2 text-sm break-all">{site.email}</div>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] p-4">
                <div className="text-xs font-semibold tracking-[0.12em] uppercase text-[color:var(--muted)]">
                  Location
                </div>
                <div className="mt-2 text-sm">{site.location}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

