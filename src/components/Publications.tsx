"use client";

import { ArrowUpRight, Copy, FileText } from "lucide-react";
import { useState } from "react";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { site } from "@/lib/site-data";

import { SectionHeader } from "./SectionHeader";

function BibTeXBlock(props: { bibtex: string }) {
  const { copy, copied } = useCopyToClipboard();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <button type="button" className="button" onClick={() => setOpen((v) => !v)}>
          <span className="text-sm">BibTeX</span>
        </button>
        <button
          type="button"
          className="button"
          onClick={async () => {
            await copy(props.bibtex);
          }}
        >
          <Copy size={16} />
          <span className="text-sm">{copied ? "已复制" : "复制"}</span>
        </button>
      </div>

      {open ? (
        <pre className="mt-3 overflow-auto rounded-xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--panel)_70%,transparent)] p-4 text-xs leading-6 text-[color:var(--muted)]">
          <code>{props.bibtex}</code>
        </pre>
      ) : null}
    </div>
  );
}

export function Publications({ papers }: { papers?: { year: number; title: string; authors: string; venue: string; pdfUrl?: string; bibtex?: string; doiUrl?: string; codeUrl?: string; }[] }) {
  const pubs = (papers || [...site.publications]).sort((a, b) => b.year - a.year);

  return (
    <section id="publications" className="section">
      <div className="container py-14">
        <SectionHeader
          eyebrow="Publications"
          title="学术成果"
          description="按年份倒序展示论文，并提供 PDF / DOI / Code 与 BibTeX 复制。"
        />

        <div className="mt-8 flex flex-col gap-4">
          {pubs.map((p) => (
            <div key={`${p.year}-${p.title}`} className="card p-5">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs text-[color:var(--muted)]">
                    {p.year}
                  </div>
                  <div className="text-xs text-[color:var(--muted)]">{p.venue}</div>
                </div>
                <div className="text-base font-semibold tracking-tight">
                  {p.title}
                </div>
                <div className="text-[13px] leading-6 text-[color:var(--muted)]">
                  {p.authors}
                </div>

                <div className="flex flex-wrap gap-2">
                  {p.pdfUrl ? (
                    <a className="button" href={p.pdfUrl} target="_blank" rel="noreferrer">
                      <FileText size={16} />
                      <span className="text-sm">PDF</span>
                    </a>
                  ) : null}
                  {p.doiUrl ? (
                    <a className="button" href={p.doiUrl} target="_blank" rel="noreferrer">
                      <ArrowUpRight size={16} />
                      <span className="text-sm">DOI</span>
                    </a>
                  ) : null}
                  {p.codeUrl ? (
                    <a className="button" href={p.codeUrl} target="_blank" rel="noreferrer">
                      <ArrowUpRight size={16} />
                      <span className="text-sm">Code</span>
                    </a>
                  ) : null}
                </div>

                {p.bibtex ? <BibTeXBlock bibtex={p.bibtex} /> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

