import { NextResponse } from "next/server";

import { getAdminCookieName } from "@/lib/admin-auth";

export const runtime = "nodejs";

export function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: getAdminCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
