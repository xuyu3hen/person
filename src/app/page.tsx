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

async function getDiaryEntries() {
  try {
    await ensureSchema();
    const sql = getSql();
    const result = await sql`
      SELECT id, date, title, content, mood
      FROM journal_diary
      ORDER BY date DESC
      LIMIT 5;
    `;
    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        date: String(r.date).slice(0, 10),
        summary: String(r.content).slice(0, 120),
        mood: r.mood ? String(r.mood) : undefined,
      };
    });
  } catch (e) {
    console.error("Failed to load diary entries:", e);
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

async function getPublicNotes() {
  try {
    await ensureSchema();
    const sql = getSql();
    const result = await sql`
      SELECT id, title, content, tags, created_at
      FROM journal_notes
      WHERE visibility = 'public'
      ORDER BY created_at DESC
      LIMIT 4;
    `;
    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        title: String(r.title),
        summary: String(r.content).replace(/\s+/g, " ").trim().slice(0, 120),
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        createdAt: new Date(String(r.created_at)).toISOString(),
      };
    });
  } catch (e) {
    console.error("Failed to load public notes:", e);
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
  const [
    papers,
    diaryEntries,
    todayPlans,
    publicNotes,
    siteContentRecord,
  ] = await Promise.all([
    getPapers(),
    getDiaryEntries(),
    getTodayPlans(),
    getPublicNotes(),
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
          diaryEntries={diaryEntries}
          todayPlans={todayPlans}
          publicNotes={publicNotes}
        />
      </main>
      <Footer siteContent={siteContent} />
    </div>
  );
}
