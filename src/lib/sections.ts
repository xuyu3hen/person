export type SectionId =
  | "home"
  | "about"
  | "research"
  | "publications"
  | "projects"
  | "contact";

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

