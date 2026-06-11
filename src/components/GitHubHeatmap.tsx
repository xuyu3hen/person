"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Github, ExternalLink } from "lucide-react";

interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

const GITHUB_USERNAME = "misty"; // fallback default

// Generate 52 weeks of mock data as a fallback
function generateMockData(): ContributionDay[] {
  const days: ContributionDay[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    // Generate somewhat realistic-looking data
    const rand = Math.random();
    let count = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (rand < 0.35) {
      count = 0;
      level = 0;
    } else if (rand < 0.6) {
      count = Math.floor(Math.random() * 3) + 1;
      level = 1;
    } else if (rand < 0.8) {
      count = Math.floor(Math.random() * 5) + 3;
      level = 2;
    } else if (rand < 0.93) {
      count = Math.floor(Math.random() * 8) + 7;
      level = 3;
    } else {
      count = Math.floor(Math.random() * 15) + 12;
      level = 4;
    }
    days.push({ date: dateStr, count, level });
  }
  return days;
}

function getLevelColor(level: number): string {
  const colors = [
    "var(--border)", // 0 - no contributions
    "color-mix(in srgb, var(--accent) 25%, transparent)", // 1
    "color-mix(in srgb, var(--accent) 50%, transparent)", // 2
    "color-mix(in srgb, var(--accent) 75%, transparent)", // 3
    "var(--accent)", // 4
  ];
  return colors[level] ?? colors[0];
}

function getMonthLabels(days: ContributionDay[]): { label: string; col: number }[] {
  const months: { label: string; col: number }[] = [];
  const monthNames = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月",
  ];
  let lastMonth = -1;
  days.forEach((day, i) => {
    const month = new Date(day.date + "T00:00:00").getMonth();
    if (isNaN(month) || month < 0 || month > 11) return;
    if (month !== lastMonth) {
      months.push({ label: monthNames[month], col: Math.floor(i / 7) });
      lastMonth = month;
    }
  });
  return months;
}

const dayLabels = ["", "一", "", "三", "", "五", ""];

export function GitHubHeatmap({ username }: { username?: string }) {
  const [data, setData] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Try to fetch real data from GitHub's API
    // GitHub doesn't have an official contributions API, so we try the
    // unofficial endpoint. If it fails, fall back to mock data.
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://github-contributions-api.deno.dev/${username || GITHUB_USERNAME}.json`
        );
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (json.contributions && Array.isArray(json.contributions)) {
          const contributions = json.contributions as {
            date: string;
            count: number;
            level?: 0 | 1 | 2 | 3 | 4;
          }[];
          // Only take last 365 days, map to our format
          const mapped = contributions.slice(-365).map((c) => ({
            date: c.date,
            count: c.count,
            level: c.level ?? (c.count === 0 ? 0 : c.count <= 3 ? 1 : c.count <= 6 ? 2 : c.count <= 10 ? 3 : 4) as 0 | 1 | 2 | 3 | 4,
          }));
          setData(mapped);
          setLoading(false);
          return;
        }
      } catch {
        // fallback to mock
      }
      setData(generateMockData());
      setError(true);
      setLoading(false);
    };
    fetchData();
  }, [username]);

  const totalContributions = useMemo(() => {
    const total = data.reduce((sum, d) => {
      const count = typeof d.count === "number" && !isNaN(d.count) ? d.count : 0;
      return sum + count;
    }, 0);
    return isNaN(total) ? 0 : total;
  }, [data]);

  const weeks = useMemo(() => {
    const w: ContributionDay[][] = [];
    for (let i = 0; i < data.length; i += 7) {
      w.push(data.slice(i, i + 7));
    }
    return w;
  }, [data]);

  const monthLabels = useMemo(() => getMonthLabels(data), [data]);

  if (loading) {
    return (
      <div className="card p-5 animate-pulse">
        <div className="h-4 w-28 bg-[color:var(--border)] rounded mb-3" />
        <div className="h-[100px] w-full bg-[color:var(--border)] rounded" />
      </div>
    );
  }

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Github size={16} className="text-[color:var(--muted)]" />
          <h3 className="text-sm font-semibold tracking-tight">GitHub 活跃度</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[color:var(--muted)]">
            过去一年 <span className="text-[color:var(--accent)] font-medium">{totalContributions}</span> 次贡献
          </span>
          <a
            href={`https://github.com/${username || GITHUB_USERNAME}`}
            target="_blank"
            rel="noreferrer"
            className="text-[color:var(--muted)] hover:text-[color:var(--accent)] transition-colors"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-[color:var(--muted)]/60 mb-2">
          显示示例数据。请设置正确的 GitHub 用户名以获取真实数据。
        </p>
      )}

      {/* Heatmap grid */}
      <div className="overflow-x-auto -mx-1">
        <div className="inline-flex flex-col gap-0.5 min-w-[680px]">
          {/* Month labels */}
          <div className="flex ml-8 mb-0.5">
            {monthLabels.map((m, i) => {
              const nextCol = i < monthLabels.length - 1 ? monthLabels[i + 1].col : 53;
              const span = Math.max(nextCol - m.col, 1);
              const width = isNaN(span) ? 12 : span * 12;
              return (
                <div
                  key={`ml-${i}-${m.label}`}
                  className="text-[9px] text-[color:var(--muted)]"
                  style={{ width: `${width}px` }}
                >
                  {m.label}
                </div>
              );
            })}
          </div>

          {/* Grid with day labels */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1.5">
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="text-[9px] text-[color:var(--muted)] h-[10px] leading-[10px]"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="flex gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => (
                    <motion.div
                      key={`${wi}-${di}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: (wi * 7 + di) * 0.001,
                        duration: 0.15,
                      }}
                      className="w-[10px] h-[10px] rounded-sm"
                      style={{ backgroundColor: getLevelColor(day.level) }}
                      title={`${day.date}: ${day.count} contributions`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[9px] text-[color:var(--muted)]">少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="w-[10px] h-[10px] rounded-sm"
            style={{ backgroundColor: getLevelColor(level) }}
          />
        ))}
        <span className="text-[9px] text-[color:var(--muted)]">多</span>
      </div>
    </div>
  );
}
