import { SectionHeader } from "./SectionHeader";

import { site } from "@/lib/site-data";

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
            <div className="text-sm leading-7 text-[color:var(--muted)]">
              我倾向于以可复现与可维护为第一原则：用清晰的实验协议表达研究贡献，
              用稳定的工程实践把原型带到真实环境。
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
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

