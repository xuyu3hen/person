import { ArrowUpRight, Globe } from "lucide-react";

import type { SiteContent } from "@/lib/site-content";
import { Starfield } from "./Starfield";
import { TodayPlansPanel } from "./TodayPlansPanel";
import { TypewriterCarousel } from "./TypewriterCarousel";

type TodayPlan = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  done: boolean;
};

export function Hero({
  siteContent,
  todayPlans,
}: {
  siteContent: SiteContent;
  todayPlans?: TodayPlan[];
}) {
  const github = siteContent.socials.find((x) => x.label === "GitHub")?.href;
  const scholar = siteContent.socials.find(
    (x) => x.label === "Google Scholar"
  )?.href;

  return (
    <section id="home" className="section relative overflow-hidden">
      <Starfield />
      <div className="container relative pt-20 pb-14 sm:pt-24 sm:pb-18">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="heroGlow" />
        </div>
        <div className="contentGrid" style={{ position: "relative", zIndex: 2 }}>
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_340px]">
            <div className="card relative overflow-hidden p-7 sm:p-9 lg:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_65%,transparent),transparent)]"
              />
              <div className="flex flex-col gap-6">
                <div className="sectionEyebrow">
                  {siteContent.profile.title}
                </div>
                <div className="flex flex-col gap-4">
                  <h1 className="heroTitle flex items-center gap-3 text-[46px] font-semibold leading-[0.98] tracking-tight sm:text-[64px]">
                    {siteContent.profile.name}
                    <Globe size={34} className="animate-[spin_20s_linear_infinite] text-[color:var(--accent)]" />
                  </h1>
                  <p className="max-w-3xl text-[17px] leading-8 text-[color:color-mix(in_srgb,var(--text)_88%,var(--muted))]">
                    {siteContent.hero.description}
                  </p>
                </div>
                <div className="panelInset rounded-[22px] p-4 sm:p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    {siteContent.hero.badgeLabel}
                  </div>
                  <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[color:var(--muted)]">
                    <TypewriterCarousel
                      texts={siteContent.hero.carouselTexts}
                    />
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-[color:var(--muted)] sm:grid-cols-3">
                  <div className="panelInset rounded-2xl px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em]">
                      {siteContent.hero.focus.label}
                    </div>
                    <div className="mt-2 text-[color:var(--text)]">
                      {siteContent.hero.focus.value}
                    </div>
                  </div>
                  <div className="panelInset rounded-2xl px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em]">
                      {siteContent.hero.mode.label}
                    </div>
                    <div className="mt-2 text-[color:var(--text)]">
                      {siteContent.hero.mode.value}
                    </div>
                  </div>
                  <div className="panelInset rounded-2xl px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em]">
                      {siteContent.hero.stack.label}
                    </div>
                    <div className="mt-2 text-[color:var(--text)]">
                      {siteContent.hero.stack.value}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {github ? (
                    <a
                      className="button buttonPrimary"
                      href={github}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ArrowUpRight size={16} />
                      <span className="text-sm">GitHub</span>
                    </a>
                  ) : null}
                  {scholar ? (
                    <a
                      className="button"
                      href={scholar}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ArrowUpRight size={16} />
                      <span className="text-sm">Scholar</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="w-full flex-shrink-0">
              <TodayPlansPanel plans={todayPlans} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

