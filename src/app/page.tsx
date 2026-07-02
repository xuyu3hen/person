import { Footer } from "@/components/Footer";
import { HomeSections } from "@/components/HomeSections";
import { TopNav } from "@/components/TopNav";
import { ensureSchema, getSql } from "@/lib/db";

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

export default async function Home() {
  const papers = await getPapers();
  const diaryEntries = await getDiaryEntries();

  return (
    <div className="flex flex-col min-h-[100svh]">
      <TopNav />
      <main className="flex-1">
        <HomeSections papers={papers} diaryEntries={diaryEntries} />
      </main>
      <Footer />
    </div>
  );
}
