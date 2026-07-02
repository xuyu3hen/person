import { ArrowUp } from "lucide-react";

import { shortVersion } from "@/app/version";
import type { SiteContent } from "@/lib/site-content";

const YEAR = new Date().getFullYear();
const BUILD_DATE = new Date().toISOString().slice(0, 10);

export function Footer({ siteContent }: { siteContent: SiteContent }) {
  const ver = shortVersion() || "dev";
  return (
    <footer className="section border-t border-[color:color-mix(in_srgb,var(--border)_72%,transparent)]">
      <div className="container py-10">
        <div className="card p-6 md:p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="sectionEyebrow">Signature Block</div>
          <div className="text-sm text-[color:var(--muted)]">
            © {YEAR} {siteContent.profile.name}
          </div>
          <div className="max-w-xl text-sm leading-7 text-[color:var(--muted)]">
            {siteContent.footer.description}
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
            最后更新：{BUILD_DATE} · 版本 {ver}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            className="button"
            href={siteContent.footer.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            <span className="text-sm">Source</span>
          </a>
          <a className="button" href="#home">
            <ArrowUp size={16} />
            <span className="text-sm">回到顶部</span>
          </a>
        </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

