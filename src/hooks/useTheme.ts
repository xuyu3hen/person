"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

function readInitialTheme(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  const t = document.documentElement.dataset.theme;
  return t === "light" ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const isLight = useMemo(() => theme === "light", [theme]);

  return { theme, isLight, setTheme, toggle };
}

