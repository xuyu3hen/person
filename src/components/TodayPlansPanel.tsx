import { CalendarDays, CheckCircle2, Clock3, Sparkles } from "lucide-react";

type TodayPlan = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  done: boolean;
};

export function TodayPlansPanel({ plans }: { plans?: TodayPlan[] }) {
  const items = plans ?? [];
  const pending = items.filter((item) => !item.done).length;

  return (
    <div className="card relative overflow-hidden p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_58%,transparent),transparent)] opacity-70"
      />
      <div className="flex items-center justify-between">
        <div>
          <div className="sectionEyebrow">Live Plans</div>
          <h3 className="mt-3 flex items-center gap-2 text-base font-semibold tracking-tight">
            <CalendarDays size={16} className="text-[color:var(--accent)]" />
            今日计划
          </h3>
        </div>
        <div className="rounded-full border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_100%,transparent)] px-3 py-1 text-xs text-[color:var(--muted)]">
          待完成 {pending}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3">
          {items.slice(0, 5).map((plan) => (
            <div
              key={plan.id}
              className="panelInset flex items-start gap-3 rounded-2xl px-4 py-4"
            >
              <div className="mt-0.5">
                {plan.done ? (
                  <CheckCircle2 size={16} className="text-[color:var(--accent)]" />
                ) : (
                  <Clock3 size={16} className="text-[color:var(--muted)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium ${plan.done ? "text-[color:var(--muted)] line-through" : "text-[color:var(--text)]"}`}>
                  {plan.title}
                </div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">
                  {plan.startTime || plan.endTime
                    ? `${plan.startTime || "--:--"}${plan.endTime ? ` - ${plan.endTime}` : ""}`
                    : "未设置时间"}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panelInset mt-5 flex items-center gap-2 rounded-2xl px-4 py-4 text-sm text-[color:var(--muted)]">
          <Sparkles size={14} className="text-[color:var(--accent)]" />
          <span>今天还没有公开计划，去后台安排一下。</span>
        </div>
      )}
    </div>
  );
}
