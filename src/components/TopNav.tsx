"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useActiveSection } from "@/hooks/useActiveSection";
import { nav } from "@/lib/site-data";
import { site } from "@/lib/site-data";
import type { SectionId } from "@/lib/sections";
import { scrollToSection } from "@/lib/sections";

import { ThemeToggle } from "./ThemeToggle";

export function TopNav() {
  const ids = useMemo(
    () => nav.map((x) => x.id) as unknown as readonly SectionId[],
    []
  );
  const activeId = useActiveSection(ids);
  const [open, setOpen] = useState(false);

  function onPick(id: SectionId) {
    scrollToSection(id);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--bg)_80%,transparent)] backdrop-blur">
      <div className="container h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onPick("home")}
          className="flex items-center gap-3"
          aria-label="回到首页"
        >
          <div className="h-9 w-9 rounded-xl border border-[color:color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_12%,transparent)] flex items-center justify-center text-[10px] font-mono text-[color:var(--muted)]">
            v1.1.1
          </div>
          <div className="flex flex-col leading-tight">
            <div className="text-sm font-semibold tracking-tight">
              {site.name}
            </div>
            <div className="text-xs text-[color:var(--muted)]">
              Journal · Plans · Life
            </div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-2">
          {nav.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item.id as SectionId)}
                className={
                  "px-3 py-2 text-sm rounded-full transition-colors border " +
                  (isActive
                    ? "border-transparent bg-[color:color-mix(in_srgb,var(--accent)_18%,transparent)] text-[color:var(--text)]"
                    : "border-transparent text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--panel)]")
                }
              >
                {item.label}
              </button>
            );
          })}
          <Link
            href="/posts"
            className="px-3 py-2 text-sm rounded-full transition-colors border border-transparent text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--panel)]"
          >
            文章
          </Link>
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
            {nav.map((item) => {
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

