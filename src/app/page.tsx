import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { HomeSections } from "@/components/HomeSections";
import { TopNav } from "@/components/TopNav";
import { ensureSchema, getSql } from "@/lib/db";
import { getSiteContentSafe } from "@/lib/site-content";

export const dynamic = "force-dynamic";

async function getPapers() {
  try {
    await ensureSchema();
    const sql = getSql();
    const result = await sql`
      SELECT id, title, authors, year, journal, pdf_url, bibtex
      FROM journal_papers
      ORDER BY year DESC, created_at DESC;
    `;
    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        year: Number(r.year),
        title: String(r.title),
        authors: String(r.authors),
        venue: String(r.journal),
        pdfUrl: r.pdf_url ? String(r.pdf_url) : undefined,
        bibtex: r.bibtex ? String(r.bibtex) : undefined,
      };
    });
  } catch (e) {
    console.error("Failed to load papers:", e);
    return undefined;
  }
}

async function getTodayPlans() {
  try {
    await ensureSchema();
    const sql = getSql();
    const result = await sql`
      SELECT id, date, start_time, end_time, title, done
      FROM journal_plans
      WHERE date = CURRENT_DATE
      ORDER BY sort_order ASC, start_time NULLS LAST, created_at DESC;
    `;
    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        date: new Date(String(r.date)).toISOString().slice(0, 10),
        startTime: r.start_time ? String(r.start_time).slice(0, 5) : "",
        endTime: r.end_time ? String(r.end_time).slice(0, 5) : "",
        title: String(r.title),
        done: r.done === true,
      };
    });
  } catch (e) {
    console.error("Failed to load today plans:", e);
    return undefined;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const siteContent = (await getSiteContentSafe()).content;
  const title = siteContent.profile.name;
  const description =
    siteContent.profile.tagline || siteContent.hero.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: "/og.svg" }],
    },
  };
}

export default async function Home() {
  const [papers, todayPlans, siteContentRecord] = await Promise.all([
    getPapers(),
    getTodayPlans(),
    getSiteContentSafe(),
  ]);
  const siteContent = siteContentRecord.content;

  return (
    <div className="appShell flex min-h-[100svh] flex-col">
      <TopNav siteContent={siteContent} />
      <main className="flex-1">
        <HomeSections
          siteContent={siteContent}
          papers={papers}
          todayPlans={todayPlans}
        />
      </main>
      <Footer siteContent={siteContent} />
    </div>
  );
}
