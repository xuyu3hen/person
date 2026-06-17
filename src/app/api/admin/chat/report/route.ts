import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminSessionCookieValue } from "@/lib/admin-auth";
import { getSql, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

function assertAdmin(req: NextRequest) {
  const cookie = req.cookies.get(getAdminCookieName())?.value;
  if (!verifyAdminSessionCookieValue(cookie)) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertAdmin(req);
    await ensureSchema();
    const { days = 7 } = await req.json();

    const sql = getSql();
    
    // 1. 获取过去 N 天的每日记录 (体重, 撸管等)
    const { rows: dailies } = await sql`
      SELECT date, weight, masturbated
      FROM journal_dailies
      WHERE date >= CURRENT_DATE - ${days}::integer
      ORDER BY date ASC
    `;

    // 2. 获取过去 N 天的计划完成情况
    const { rows: plans } = await sql`
      SELECT date, title, done
      FROM journal_plans
      WHERE date >= CURRENT_DATE - ${days}::integer
      ORDER BY date ASC
    `;

    // 3. 构造喂给 DeepSeek 的 Prompt
    let prompt = `请你作为我的私人生活教练和数据分析师，根据我过去 ${days} 天的数据，给我生成一份走心的健康与效率评估报告。\n\n`;
    
    prompt += `【每日健康与状态记录】：\n`;
    if (dailies.length === 0) {
      prompt += "没有记录。\n";
    } else {
      (dailies as { date: string; weight: number | null; masturbated: boolean }[]).forEach((d) => {
        prompt += `- ${d.date}: 体重 ${d.weight || '未记录'}kg, 撸管: ${d.masturbated ? '是 💦' : '否 ✨'}\n`;
      });
    }

    prompt += `\n【每日计划与完成情况】：\n`;
    if (plans.length === 0) {
      prompt += "没有计划记录。\n";
    } else {
      const plansByDate: Record<string, { date: string; title: string; done: boolean }[]> = {};
      (plans as { date: string; title: string; done: boolean }[]).forEach((p) => {
        if (!plansByDate[p.date]) plansByDate[p.date] = [];
        plansByDate[p.date].push(p);
      });
      for (const [date, dayPlans] of Object.entries(plansByDate)) {
        prompt += `- ${date}:\n`;
        dayPlans.forEach((p) => {
          prompt += `  * [${p.done ? 'x' : ' '}] ${p.title}\n`;
        });
      }
    }

    prompt += `\n请你：\n1. 总结我体重变化的趋势（如果有数据）。\n2. 评估我的欲望控制情况（撸管频率），用鼓励或者幽默的方式点评。\n3. 分析我的计划执行力（完成率），表扬做得好的，指出需要改进的。\n4. 给我下一周的简单建议。\n\n语气要像一个懂我的、幽默且严厉的私人教练，排版要清晰（使用 Markdown）。`;

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw Object.assign(new Error("DEEPSEEK_API_KEY is not configured"), { status: 500 });
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw Object.assign(new Error(`DeepSeek API error: ${err}`), { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ report: data.choices[0].message.content });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}