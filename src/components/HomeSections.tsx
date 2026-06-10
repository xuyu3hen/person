"use client";

import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { GitHubHeatmap } from "@/components/GitHubHeatmap";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Publications } from "@/components/Publications";
import { Research } from "@/components/Research";
import { TimelineDiary } from "@/components/TimelineDiary";
import { ParallaxSection } from "./ParallaxSection";

interface HomeSectionsProps {
  papers: {
    year: number;
    title: string;
    authors: string;
    venue: string;
    pdfUrl?: string;
    bibtex?: string;
  }[] | undefined;
}

export function HomeSections({ papers }: HomeSectionsProps) {
  return (
    <>
      <Hero />
      <ParallaxSection offset={-18}>
        <TimelineDiary />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <About />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <Research />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <Publications papers={papers} />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <Projects />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <Experience />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <GitHubHeatmap username="xuyu3hen" />
      </ParallaxSection>
    </>
  );
}
