import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Publications } from "@/components/Publications";
import { Research } from "@/components/Research";
import { TopNav } from "@/components/TopNav";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100svh]">
      <TopNav />
      <main className="flex-1">
        <Hero />
        <About />
        <Research />
        <Publications />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
