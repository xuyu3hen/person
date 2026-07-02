"use client";

import { Copy, Mail, MapPin } from "lucide-react";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { SiteContent } from "@/lib/site-content";

import { SectionHeader } from "./SectionHeader";

export function Contact({ siteContent }: { siteContent: SiteContent }) {
  const { copy, copied } = useCopyToClipboard();
  const socials = siteContent.socials.filter((s) => s.href.trim().length > 0);

  return (
    <section id="contact" className="section">
      <div className="container py-14">
        <SectionHeader
          eyebrow="Contact"
          title="联系方式"
          description={siteContent.contactSection.description}
        />

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="card relative overflow-hidden p-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_55%,transparent),transparent)] opacity-70"
            />
            <div className="sectionEyebrow">Direct Channel</div>
            <div className="mt-4 text-sm font-semibold tracking-tight">Email</div>
            <div className="mt-3 flex flex-col gap-3">
              <div className="panelInset rounded-2xl p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Primary Email</div>
                <div className="mt-3 text-sm text-[color:var(--text)] break-all">
                  {siteContent.profile.email}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="button"
                    onClick={async () => {
                      await copy(siteContent.profile.email);
                    }}
                  >
                    <Copy size={16} />
                    <span className="text-sm">{copied ? "已复制" : "复制"}</span>
                  </button>
                  <a
                    className="button buttonPrimary"
                    href={`mailto:${siteContent.profile.email}`}
                  >
                    <Mail size={16} />
                    <span className="text-sm">写邮件</span>
                  </a>
                </div>
              </div>
              <div className="panelInset rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                  <MapPin size={14} />
                  <span>{siteContent.profile.location}</span>
                  <span className="opacity-60">·</span>
                  <span>{siteContent.profile.timezone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="sectionEyebrow">Identity Graph</div>
            <div className="mt-4 text-sm font-semibold tracking-tight">Links</div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  className="panelInset flex items-center justify-between rounded-2xl px-4 py-4 text-sm transition-colors hover:border-[color:color-mix(in_srgb,var(--accent)_24%,var(--border))]"
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

