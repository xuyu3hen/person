"use client";

import type { SiteContent } from "@/lib/site-content";

import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { GitHubHeatmap } from "@/components/GitHubHeatmap";
import { Hero } from "@/components/Hero";
import { PublicNotesPreview } from "@/components/PublicNotesPreview";
import { Projects } from "@/components/Projects";
import { Publications } from "@/components/Publications";
import { Research } from "@/components/Research";
import { TimelineDiary } from "@/components/TimelineDiary";
import { ParallaxSection } from "./ParallaxSection";

interface HomeSectionsProps {
  siteContent: SiteContent;
  papers: {
    year: number;
    title: string;
    authors: string;
    venue: string;
    pdfUrl?: string;
    bibtex?: string;
  }[] | undefined;
  diaryEntries?: {
    date: string;
    summary: string;
    mood?: string;
    slug?: string;
  }[];
  todayPlans?: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    title: string;
    done: boolean;
  }[];
  publicNotes?: {
    id: string;
    title: string;
    summary: string;
    tags: string[];
    createdAt: string;
  }[];
}

export function HomeSections({
  siteContent,
  papers,
  diaryEntries,
  todayPlans,
  publicNotes,
}: HomeSectionsProps) {
  return (
    <>
      <Hero siteContent={siteContent} todayPlans={todayPlans} />
      <ParallaxSection offset={-18}>
        <PublicNotesPreview notes={publicNotes} />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <TimelineDiary diaryEntries={diaryEntries} />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <About siteContent={siteContent} />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <Research siteContent={siteContent} />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <Publications papers={papers} />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <Projects siteContent={siteContent} />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <Experience siteContent={siteContent} />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <Contact siteContent={siteContent} />
      </ParallaxSection>
      <ParallaxSection offset={-18}>
        <GitHubHeatmap username="xuyu3hen" />
      </ParallaxSection>
    </>
  );
}
