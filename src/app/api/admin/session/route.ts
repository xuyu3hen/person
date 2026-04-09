import { NextRequest, NextResponse } from "next/server";

import { getAdminCookieName, verifyAdminSessionCookieValue } from "@/lib/admin-auth";

export const runtime = "nodejs";

export function GET(req: NextRequest) {
  const cookie = req.cookies.get(getAdminCookieName())?.value;
  const ok = verifyAdminSessionCookieValue(cookie);
  return NextResponse.json({ ok });
}

