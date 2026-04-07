import { SectionHeader } from "./SectionHeader";

import { site } from "@/lib/site-data";

export function Research() {
  return (
    <section id="research" className="section">
      <div className="container py-14">
        <SectionHeader
          eyebrow="Research"
          title="研究方向"
          description="用卡片概括研究问题、关键词与代表性贡献。"
        />

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {site.researchAreas.map((r) => (
            <div key={r.title} className="card p-5">
              <div className="flex flex-col gap-3">
                <div className="text-base font-semibold tracking-tight">
                  {r.title}
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] px-3 py-1 text-xs font-mono text-[color:var(--muted)]"
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

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="text-sm font-semibold tracking-tight">
              技术栈 / 工具
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {[
                { label: "前端", value: 78 },
                { label: "后端", value: 72 },
                { label: "AI/算法", value: 80 },
                { label: "科研工具", value: 85 },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{s.label}</div>
                    <div className="text-xs text-[color:var(--muted)]">
                      {s.value}%
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[color:color-mix(in_srgb,var(--panel)_80%,transparent)] border border-[color:var(--border)] overflow-hidden">
                    <div
                      className="h-full bg-[color:color-mix(in_srgb,var(--accent)_70%,transparent)]"
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-semibold tracking-tight">
              方法论
            </div>
            <div className="mt-4 text-[14px] leading-7 text-[color:var(--muted)]">
              我偏好将问题拆成“可测指标 + 可复现实验 + 可维护实现”，并优先构建
              可观测性与失败分析工具链，让结果可解释、迭代可控。
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                "Benchmarks",
                "Ablations",
                "Tracing",
                "Profiling",
                "Experiment Logs",
              ].map((t) => (
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

