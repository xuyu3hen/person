import { describe, expect, it } from "vitest";

import { nav, site } from "./site-data";

describe("site-data", () => {
  it("has required nav sections", () => {
    const ids = nav.map((n) => n.id);
    expect(ids).toEqual([
      "home",
      "about",
      "research",
      "publications",
      "projects",
      "contact",
    ]);
  });

  it("has unique nav ids", () => {
    const ids = nav.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has basic profile fields", () => {
    expect(site.name.length).toBeGreaterThan(0);
    expect(site.title.length).toBeGreaterThan(0);
    expect(site.email.includes("@")).toBe(true);
  });

  it("publications are sorted by year descending", () => {
    const years = site.publications.map((p) => p.year);
    const sorted = [...years].sort((a, b) => b - a);
    expect(years).toEqual(sorted);
  });
});

