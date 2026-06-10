import { ArrowUpRight, Globe } from "lucide-react";

import { site } from "@/lib/site-data";
import { Starfield } from "./Starfield";
import { TodoWidget } from "./TodoWidget";
import { TypewriterCarousel } from "./TypewriterCarousel";

export function Hero() {
  const github = site.socials.find((x) => x.label === "GitHub")?.href;
  const scholar = site.socials.find((x) => x.label === "Google Scholar")?.href;

  return (
    <section id="home" className="section relative overflow-hidden">
      <Starfield />
      <div className="container pt-16 pb-12 relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="heroGlow" />
        </div>
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: Hero content */}
            <div className="flex flex-col gap-6 flex-1">
              <div className="flex flex-col gap-3">
                <div className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--muted)]">
                  {site.title}
                </div>
                <h1 className="text-[42px] leading-[1.08] font-semibold tracking-tight heroTitle flex items-center gap-3">
                  {site.name}
                  <Globe size={32} className="animate-[spin_20s_linear_infinite] text-blue-500" />
                </h1>
                <p className="max-w-2xl text-[15px] leading-7 text-[color:var(--muted)]">
                  <TypewriterCarousel
                    texts={[
                      "Stay hungry, stay foolish.",
                      "求知若饥，虚心若愚。",
                      "今天也要认真生活。",
                      "简单 · 规律 · 可持续。",
                    ]}
                  />
                </p>
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

            {/* Right: Todo Widget */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
              <TodoWidget />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

