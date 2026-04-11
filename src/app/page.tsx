import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Publications } from "@/components/Publications";
import { Research } from "@/components/Research";
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
    return result.rows.map((r: Record<string, unknown>) => ({
      year: Number(r.year),
      title: String(r.title),
      authors: String(r.authors),
      venue: String(r.journal),
      pdfUrl: r.pdf_url ? String(r.pdf_url) : undefined,
      bibtex: r.bibtex ? String(r.bibtex) : undefined,
    }));
  } catch (e) {
    console.error("Failed to load papers:", e);
    return undefined;
  }
}

export default async function Home() {
  const papers = await getPapers();

  return (
    <div className="flex flex-col min-h-[100svh]">
      <TopNav />
      <main className="flex-1">
        <Hero />
        <About />
        <Research />
        <Publications papers={papers} />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
