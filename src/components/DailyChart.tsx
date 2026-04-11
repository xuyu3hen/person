"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Legend,
} from "recharts";
import { subDays, subMonths, subYears, isAfter, parseISO, format } from "date-fns";

export type DailyData = {
  id: string;
  date: string;
  weight: number | null;
  masturbated: boolean;
};

export function DailyChart({ data }: { data: DailyData[] }) {
  const [range, setRange] = useState<"week" | "month" | "year" | "all">("month");

  // Filter and sort data ascending (oldest to newest)
  const chartData = useMemo(() => {
    let filtered = [...data];
    const now = new Date();

    if (range !== "all") {
      let thresholdDate: Date;
      if (range === "week") thresholdDate = subDays(now, 7);
      else if (range === "month") thresholdDate = subMonths(now, 1);
      else thresholdDate = subYears(now, 1);

      filtered = filtered.filter((d) => isAfter(parseISO(d.date), thresholdDate));
    }

    return filtered.sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d,
      masturbationValue: d.masturbated ? 1 : 0, // For bar chart
      displayDate: format(parseISO(d.date), "MM-dd"),
    }));
  }, [data, range]);

  // Calculate min and max weight for better Y-axis scaling
  const weightDomain = useMemo(() => {
    const weights = chartData.map(d => d.weight).filter((w): w is number => w !== null);
    if (weights.length === 0) return [0, 100];
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    return [Math.max(0, Math.floor(min - 2)), Math.ceil(max + 2)];
  }, [chartData]);

  if (data.length === 0) {
    return <div className="text-sm text-[color:var(--muted)] p-4 text-center">暂无足够的数据生成图表</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm">数据趋势</h3>
        <div className="flex gap-2 bg-[color:var(--panel)] p-1 rounded-lg border border-[color:var(--border)]">
          {(["week", "month", "year", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                range === r
                  ? "bg-[color:var(--accent)] text-white"
                  : "hover:bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] text-[color:var(--muted)]"
              }`}
            >
              {r === "week" ? "近7天" : r === "month" ? "近1月" : r === "year" ? "近1年" : "全部"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full mt-4 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "var(--muted)" }} 
              dy={10}
            />
            <YAxis 
              yAxisId="weight" 
              domain={weightDomain} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "var(--muted)" }} 
              dx={-10}
            />
            <YAxis 
              yAxisId="masturbated" 
              orientation="right" 
              domain={[0, 1]} 
              hide={true} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "var(--panel)", 
                borderColor: "var(--border)",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                fontSize: "14px"
              }}
              labelStyle={{ fontWeight: 600, marginBottom: "8px", color: "var(--fg)" }}
              formatter={(value: unknown, name: unknown) => {
                if (name === "weight") return [value ? `${value} kg` : "未记录", "体重"];
                if (name === "masturbationValue") return [value === 1 ? "是" : "否", "是否自慰"];
                return [value as string | number, String(name)];
              }}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Bar 
              yAxisId="masturbated" 
              dataKey="masturbationValue" 
              name="自慰标记" 
              fill="var(--accent)" 
              fillOpacity={0.2}
              barSize={20}
              radius={[4, 4, 0, 0]}
            />
            <Line 
              yAxisId="weight" 
              type="monotone" 
              dataKey="weight" 
              name="体重 (kg)" 
              stroke="var(--accent)" 
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              connectNulls={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
