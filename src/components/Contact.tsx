"use client";

import { Copy, Mail, MapPin } from "lucide-react";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { site } from "@/lib/site-data";

import { SectionHeader } from "./SectionHeader";

export function Contact() {
  const { copy, copied } = useCopyToClipboard();

  return (
    <section id="contact" className="section">
      <div className="container py-14">
        <SectionHeader
          eyebrow="Contact"
          title="联系方式"
          description="提供邮箱复制、mailto 与常用学术/社交链接。"
        />

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="text-sm font-semibold tracking-tight">Email</div>
            <div className="mt-3 flex flex-col gap-3">
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] p-4">
                <div className="text-xs text-[color:var(--muted)]">{site.email}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="button"
                    onClick={async () => {
                      await copy(site.email);
                    }}
                  >
                    <Copy size={16} />
                    <span className="text-sm">{copied ? "已复制" : "复制"}</span>
                  </button>
                  <a className="button buttonPrimary" href={`mailto:${site.email}`}>
                    <Mail size={16} />
                    <span className="text-sm">写邮件</span>
                  </a>
                </div>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] p-4">
                <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                  <MapPin size={14} />
                  <span>{site.location}</span>
                  <span className="opacity-60">·</span>
                  <span>{site.timezone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="text-sm font-semibold tracking-tight">Links</div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {site.socials.map((s) => (
                <a
                  key={s.label}
                  className="flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-sm transition-colors hover:border-[color:var(--border)] hover:bg-[color:var(--panel)]"
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{s.label}</span>
                  <span className="text-xs text-[color:var(--muted)] break-all">
                    {s.href}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

