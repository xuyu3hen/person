"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useTheme } from "@/hooks/useTheme";

function useHasHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => {
      Promise.resolve().then(onStoreChange);
      return () => {};
    },
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { isLight, toggle } = useTheme();
  const hydrated = useHasHydrated();

  if (!hydrated) {
    return (
      <button
        type="button"
        className="button"
        aria-label="切换主题"
        title="切换主题"
      >
        <Sun size={16} />
        <span className="text-sm">Theme</span>
      </button>
    );
  }

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

