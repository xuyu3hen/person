import { ArrowUp } from "lucide-react";

import { shortVersion } from "@/app/version";
import { site } from "@/lib/site-data";

const YEAR = new Date().getFullYear();
const BUILD_DATE = new Date().toISOString().slice(0, 10);

export function Footer() {
  const ver = shortVersion() || "dev";
  return (
    <footer className="border-t border-[color:var(--border)]">
      <div className="container py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-[color:var(--muted)]">
            © {YEAR} {site.name}
          </div>
          <div className="text-xs text-[color:var(--muted)]">
            最后更新：{BUILD_DATE} · 版本 {ver}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            className="button"
            href="https://github.com/xuyu3hen/person"
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
    </footer>
  );
}

