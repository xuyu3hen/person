"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Home,
  User,
  FlaskConical,
  BookOpen,
  FolderGit2,
  Briefcase,
  Settings,
  ArrowRight,
  Command,
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = [
    {
      id: "home",
      label: "回到首页",
      description: "跳转到首页",
      icon: <Home size={16} />,
      action: () => scrollToSection("home", router),
      keywords: ["home", "index", "首页", "主页"],
    },
    {
      id: "about",
      label: "关于我",
      description: "了解我的背景和经历",
      icon: <User size={16} />,
      action: () => scrollToSection("about", router),
      keywords: ["about", "关于", "介绍", "背景"],
    },
    {
      id: "research",
      label: "研究方向",
      description: "查看我的研究兴趣和方向",
      icon: <FlaskConical size={16} />,
      action: () => scrollToSection("research", router),
      keywords: ["research", "研究", "方向", "兴趣"],
    },
    {
      id: "publications",
      label: "学术成果",
      description: "查看发表的论文",
      icon: <BookOpen size={16} />,
      action: () => scrollToSection("publications", router),
      keywords: ["publications", "papers", "论文", "学术", "发表"],
    },
    {
      id: "projects",
      label: "开源项目",
      description: "浏览我的项目作品",
      icon: <FolderGit2 size={16} />,
      action: () => scrollToSection("projects", router),
      keywords: ["projects", "项目", "开源", "作品"],
    },
    {
      id: "experience",
      label: "工作经历",
      description: "查看我的职业经历",
      icon: <Briefcase size={16} />,
      action: () => scrollToSection("experience", router),
      keywords: ["experience", "工作", "经历", "职业"],
    },
    {
      id: "diary",
      label: "日记",
      description: "查看我的日记和日常记录",
      icon: <FileText size={16} />,
      action: () => scrollToSection("diary", router),
      keywords: ["diary", "日记", "日常", "记录"],
    },
    {
      id: "posts",
      label: "文章列表",
      description: "浏览所有文章",
      icon: <FileText size={16} />,
      action: () => {
        router.push("/posts");
      },
      keywords: ["posts", "文章", "blog", "博客"],
    },
    {
      id: "admin",
      label: "后台管理",
      description: "进入管理后台",
      icon: <Settings size={16} />,
      action: () => {
        router.push("/admin");
      },
      keywords: ["admin", "管理", "后台", "设置"],
    },
  ];

  const filteredCommands = query.trim()
    ? commands.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description?.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        );
      })
    : commands;

  const reset = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        reset();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, reset]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filteredCommands[activeIndex];
      if (cmd) {
        cmd.action();
        reset();
      }
    } else if (e.key === "Escape") {
      reset();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-cmd-item]');
      const active = items[activeIndex] as HTMLElement | undefined;
      active?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <>
      {/* Trigger hint */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 card p-2.5 shadow-lg hover:shadow-xl transition-shadow group"
        title="命令面板 (Cmd+K)"
      >
        <Command size={16} className="text-[color:var(--muted)] group-hover:text-[color:var(--accent)] transition-colors" />
      </button>

      {/* Overlay + Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={reset}
            />
            <motion.div
              className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
              initial={{ opacity: 0, scale: 0.95, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="card overflow-hidden shadow-2xl">
                {/* Search */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[color:var(--border)]">
                  <Search size={16} className="text-[color:var(--muted)] flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入命令搜索..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--muted)]/50"
                  />
                  <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[color:var(--border)] text-[color:var(--muted)] font-mono">
                    ESC
                  </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2">
                  {filteredCommands.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[color:var(--muted)]">
                      没有找到匹配的命令
                    </div>
                  ) : (
                    filteredCommands.map((cmd, i) => (
                      <div
                        key={cmd.id}
                        data-cmd-item
                        onClick={() => {
                          cmd.action();
                          reset();
                        }}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                          i === activeIndex
                            ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                            : "text-[color:var(--text)] hover:bg-[color:var(--border)]/30"
                        }`}
                        onMouseEnter={() => setActiveIndex(i)}
                      >
                        <span
                          className={
                            i === activeIndex
                              ? "text-[color:var(--accent)]"
                              : "text-[color:var(--muted)]"
                          }
                        >
                          {cmd.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-[color:var(--muted)] truncate">
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {i === activeIndex && (
                          <ArrowRight size={14} className="text-[color:var(--accent)] flex-shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-[color:var(--border)] text-[10px] text-[color:var(--muted)]">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[color:var(--border)]">↑↓</kbd>
                    导航
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[color:var(--border)]">↵</kbd>
                    选择
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-[color:var(--border)]">Esc</kbd>
                    关闭
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function scrollToSection(id: string, router?: ReturnType<typeof useRouter>) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    // Fallback: try navigating to the section on the homepage
    router?.push(`/#${id}`);
  }
}
