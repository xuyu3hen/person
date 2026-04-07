"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { isLight, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="button"
      aria-label={isLight ? "切换到深色" : "切换到浅色"}
      title={isLight ? "切换到深色" : "切换到浅色"}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
      <span className="text-sm">{isLight ? "Dark" : "Light"}</span>
    </button>
  );
}

