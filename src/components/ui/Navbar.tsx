"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Navbar({ children }: { children?: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6 transition-all duration-300",
        scrolled
          ? "bg-[color:var(--bg)]/80 backdrop-blur-md border-b border-[color:var(--border)] shadow-sm"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="flex items-center gap-6">
        <div className="font-bold text-lg tracking-tight">AI Design System</div>
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-[color:var(--muted)]">
          <a href="#" className="hover:text-[color:var(--text)] transition-colors">Products</a>
          <a href="#" className="hover:text-[color:var(--text)] transition-colors">Research</a>
          <a href="#" className="hover:text-[color:var(--text)] transition-colors">Company</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {children}
        <ThemeSwitcher />
      </div>
    </motion.header>
  );
}
