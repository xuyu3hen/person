"use client";

import { useEffect, useMemo, useState } from "react";

import type { SectionId } from "@/lib/sections";

export function useActiveSection(sectionIds: readonly SectionId[]) {
  const ids = useMemo(() => [...sectionIds], [sectionIds]);
  const [activeId, setActiveId] = useState<SectionId>(ids[0] ?? "home");

  useEffect(() => {
    const els = ids
      .map((id) => ({ id, el: document.getElementById(id) }))
      .filter((x): x is { id: SectionId; el: HTMLElement } =>
        Boolean(x.el)
      );

    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0)
          )[0];

        if (visible) {
          const match = els.find((x) => x.el === visible.target);
          if (match) setActiveId(match.id);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8],
        rootMargin: "-20% 0px -60% 0px",
      }
    );

    for (const { el } of els) observer.observe(el);
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

