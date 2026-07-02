import { NextRequest, NextResponse } from "next/server";

import {
  getAdminCookieName,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-auth";
import { getSiteContent, saveSiteContent } from "@/lib/site-content";

export const runtime = "nodejs";

function assertAdmin(req: NextRequest) {
  const cookie = req.cookies.get(getAdminCookieName())?.value;
  if (!verifyAdminSessionCookieValue(cookie)) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}

function getErrorStatus(e: unknown) {
  if (e && typeof e === "object" && "status" in e) {
    const status = (e as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return 500;
}

function getErrorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Internal error";
}

export async function GET(req: NextRequest) {
  try {
    assertAdmin(req);
    const result = await getSiteContent();
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(e) },
      { status: getErrorStatus(e) }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    assertAdmin(req);
    const body = await req.json().catch(() => null);
    const payload =
      body && typeof body === "object" && "content" in body
        ? (body as { content?: unknown }).content
        : body;
    const result = await saveSiteContent(payload);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(e) },
      { status: getErrorStatus(e) }
    );
  }
}
