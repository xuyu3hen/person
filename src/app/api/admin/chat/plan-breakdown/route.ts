import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminSessionCookieValue } from "@/lib/admin-auth";

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
    const { goal, date } = await req.json();

    if (!goal || !date) {
      throw Object.assign(new Error("Goal and date are required"), { status: 400 });
    }

    let prompt = `我今天（${date}）有一个大目标：“${goal}”。\n\n`;
    prompt += `请你作为一个高效的时间管理专家，帮我把这个目标拆分成 3 到 5 个具体、可执行的子任务。\n`;
    prompt += `请直接返回一个 JSON 数组，不要包含任何其他文字或 Markdown 格式标记。\n`;
    prompt += `JSON 数组格式如下：\n`;
    prompt += `[\n  { "title": "子任务1名称" },\n  { "title": "子任务2名称" }\n]\n`;

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
        temperature: 0.5,
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw Object.assign(new Error(`DeepSeek API error: ${err}`), { status: response.status });
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // 清理可能的 Markdown 代码块
    if (content.startsWith("\`\`\`json")) {
      content = content.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
    } else if (content.startsWith("\`\`\`")) {
      content = content.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
    }

    let subtasks = [];
    try {
      subtasks = JSON.parse(content);
    } catch (e: unknown) {
      throw new Error(`Failed to parse AI response as JSON: ${content}`);
    }

    return NextResponse.json({ subtasks });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}