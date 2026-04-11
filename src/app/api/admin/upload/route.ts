import { NextRequest, NextResponse } from "next/server";
import { getAdminCookieName, verifyAdminSessionCookieValue } from "@/lib/admin-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw Object.assign(new Error("No file uploaded"), { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/papers directory
    const publicDir = join(process.cwd(), "public", "papers");
    try {
      await mkdir(publicDir, { recursive: true });
    } catch {
      // directory might already exist, ignore
    }

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = join(publicDir, filename);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/papers/${filename}`
    });
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as Record<string, unknown>).status) : 500;
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status });
  }
}