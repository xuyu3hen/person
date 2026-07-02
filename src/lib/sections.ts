export const SECTION_IDS = [
  "home",
  "about",
  "research",
  "publications",
  "projects",
  "contact",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export function isSectionId(value: string): value is SectionId {
  return SECTION_IDS.includes(value as SectionId);
}

export function getSectionEl(id: SectionId) {
  return typeof document === "undefined"
    ? null
    : (document.getElementById(id) as HTMLElement | null);
}

export function scrollToSection(id: SectionId) {
  const el = getSectionEl(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

