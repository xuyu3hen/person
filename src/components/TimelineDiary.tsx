"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, PenLine } from "lucide-react";

interface DiaryEntry {
  date: string;
  summary: string;
  mood?: string;
  slug?: string;
}

const fallbackEntries: DiaryEntry[] = [
  {
    date: "2026-06-10",
    summary: "今天开始重构个人主页，加入了星空背景和打字机效果，感觉整体氛围好了很多。",
    mood: "productive",
  },
  {
    date: "2026-06-09",
    summary: "读了关于 AI Agent 的最新论文，对 multi-agent 协作有了新的理解。",
    mood: "inspired",
  },
  {
    date: "2026-06-08",
    summary: "周末整理了一下书单，打算这个月读完《深度工作》和《原子习惯》。",
    mood: "relaxed",
  },
  {
    date: "2026-06-07",
    summary: "修复了一个困扰已久的 bug，原来是状态更新的时序问题。",
    mood: "accomplished",
  },
  {
    date: "2026-06-06",
    summary: "开始学习 Rust，感觉所有权系统很有意思但也很有挑战。",
    mood: "learning",
  },
];

const moodEmoji: Record<string, string> = {
  productive: "⚡",
  inspired: "💡",
  relaxed: "🌿",
  accomplished: "🎯",
  learning: "📚",
  happy: "😊",
  tired: "😴",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${month}月${day}日 ${weekdays[d.getDay()]}`;
}

function Card({ entry, index }: { entry: DiaryEntry; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: "easeOut" }}
      className="group relative pl-10 pb-8 last:pb-0"
    >
      {/* Timeline dot & line */}
      <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-[color:var(--accent)] bg-[color:var(--panel)] ring-2 ring-[color:var(--bg)] z-10 group-hover:scale-125 transition-transform duration-200" />
      {index < fallbackEntries.length - 1 && (
        <div className="absolute left-[5px] top-4 bottom-0 w-[2px] bg-[color:var(--border)]" />
      )}

      {/* Card */}
      <a
        href={entry.slug ? `/posts/${entry.slug}` : "#"}
        className="block card p-4 hover:border-[color:var(--accent)] transition-all duration-200"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[color:var(--muted)] flex items-center gap-1.5">
            <Calendar size={12} />
            {formatDate(entry.date)}
          </span>
          {entry.mood && moodEmoji[entry.mood] && (
            <span className="text-sm">{moodEmoji[entry.mood]}</span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-[color:var(--text)] line-clamp-2 group-hover:text-[color:var(--accent)] transition-colors">
          {entry.summary}
        </p>
        <div className="mt-2 flex items-center gap-1 text-xs text-[color:var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
          <PenLine size={11} />
          <span>阅读更多</span>
          <ChevronRight size={12} />
        </div>
      </a>
    </motion.div>
  );
}

export function TimelineDiary() {
  return (
    <section id="diary" className="section">
      <div className="container py-12">
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--muted)] mb-2">
            日记
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">最近记录</h2>
        </div>
        <div className="max-w-2xl">
          {fallbackEntries.map((entry, i) => (
            <Card key={entry.date} entry={entry} index={i} />
          ))}
        </div>
        <a
          href="/posts"
          className="inline-flex items-center gap-1.5 mt-6 text-sm text-[color:var(--muted)] hover:text-[color:var(--accent)] transition-colors"
        >
          <span>查看全部日记</span>
          <ChevronRight size={14} />
        </a>
      </div>
    </section>
  );
}
