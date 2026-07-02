"use client";

import { Menu, X, Settings, Globe } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

import { useActiveSection } from "@/hooks/useActiveSection";
import type { SiteContent } from "@/lib/site-content";
import type { SectionId } from "@/lib/sections";
import { scrollToSection } from "@/lib/sections";

import { ThemeToggle } from "./ThemeToggle";

import pkg from "../../package.json";

export function TopNav({ siteContent }: { siteContent: SiteContent }) {
  const ids = useMemo(
    () =>
      siteContent.nav.map((x) => x.id).filter((id): id is SectionId => Boolean(id)),
    [siteContent.nav]
  );
  const activeId = useActiveSection(ids);
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session")
      .then(r => r.json())
      .then(d => setIsAdmin(d?.ok === true))
      .catch(() => {});
  }, []);

  function onPick(id: SectionId) {
    scrollToSection(id);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[color:color-mix(in_srgb,var(--border)_70%,transparent)] bg-[color:color-mix(in_srgb,var(--bg)_72%,transparent)] backdrop-blur-xl">
      <div className="container h-[74px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onPick("home")}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--accent)_26%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_84%,transparent)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_8%,transparent),0_14px_40px_rgba(2,6,23,0.25)] text-[10px] font-mono text-[color:var(--muted)] transition-all hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:text-[color:var(--text)]"
            aria-label="回到首页"
          >
            v{pkg.version}
          </button>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
              <button onClick={() => onPick("home")} className="text-left transition-colors hover:text-[color:var(--accent)]">
                {siteContent.profile.name}
              </button>
              <Globe size={14} className="animate-[spin_20s_linear_infinite] text-[color:var(--accent)]" />
            </div>
            <div className="cursor-pointer text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] transition-colors hover:text-[color:var(--accent)]" onClick={() => onPick("home")}>
              {siteContent.profile.tagline || "Build · Research · Journal"}
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--border)_82%,transparent)] bg-[color:color-mix(in_srgb,var(--panel)_72%,transparent)] px-2 py-2 shadow-[0_12px_40px_rgba(2,6,23,0.18)]">
          {siteContent.nav.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item.id as SectionId)}
                className={
                  "px-3 py-2 text-sm rounded-full transition-all border " +
                  (isActive
                    ? "border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_16%,transparent)] text-[color:var(--text)] shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_10%,transparent)]"
                    : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:color-mix(in_srgb,var(--surface)_100%,transparent)]")
                }
              >
                {item.label}
              </button>
            );
          })}
          <Link
            href="/posts"
            className="px-3 py-2 text-sm rounded-full transition-colors border border-transparent text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:color-mix(in_srgb,var(--surface)_100%,transparent)]"
          >
            文章
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              target="_blank"
              className="ml-2 flex items-center gap-1.5 rounded-full border border-[color:color-mix(in_srgb,var(--accent)_35%,var(--border))] px-3 py-2 text-sm text-[color:var(--accent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--accent)_18%,transparent)]"
              title="进入后台"
            >
              <Settings size={14} />
              后台
            </Link>
          )}
          <div className="w-2" />
          <ThemeToggle />
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "关闭菜单" : "打开菜单"}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="md:hidden border-t border-[color:var(--border)] bg-[color:var(--bg)]">
          <div className="container py-3 flex flex-col gap-1">
            {siteContent.nav.map((item) => {
              const isActive = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPick(item.id as SectionId)}
                  className={
                    "flex items-center justify-between rounded-xl px-4 py-3 text-sm border transition-colors " +
                    (isActive
                      ? "border-[color:color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color:var(--panel)]"
                      : "border-transparent hover:border-[color:var(--border)] hover:bg-[color:var(--panel)]")
                  }
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-[color:var(--muted)]">#{item.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}

