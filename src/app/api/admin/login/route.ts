import { NextRequest, NextResponse } from "next/server";

import {
  assertAdminPasswordConfigured,
  createAdminSessionCookieValue,
  getAdminCookieName,
  isPasswordValid,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertAdminPasswordConfigured();
    const body = (await req.json().catch(() => null)) as
      | { password?: unknown }
      | null;
    const password = typeof body?.password === "string" ? body.password : "";

    if (!isPasswordValid(password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: getAdminCookieName(),
      value: createAdminSessionCookieValue(),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
