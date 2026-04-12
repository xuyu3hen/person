"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Palette } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "OpenAI Light", icon: Sun },
  { value: "dark", label: "OpenAI Dark", icon: Moon },
  { value: "anthropic-light", label: "Claude Light", icon: Palette },
  { value: "anthropic-dark", label: "Claude Dark", icon: Palette },
  { value: "monochrome", label: "Monochrome", icon: Palette },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-10 h-10" />; // placeholder

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label="Toggle theme"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-12 w-48 rounded-xl border border-[color:var(--border)] bg-[color:var(--panel)] p-1 shadow-lg backdrop-blur-xl z-50"
          >
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  theme === t.value
                    ? "bg-[color:var(--accent)] text-[color:var(--bg)]"
                    : "text-[color:var(--text)] hover:bg-[color:color-mix(in_srgb,var(--border)_50%,transparent)]"
                )}
              >
                <t.icon size={14} />
                <span>{t.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
