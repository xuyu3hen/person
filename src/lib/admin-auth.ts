import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "admin_session";

function getPassword() {
  return process.env.ADMIN_PASSWORD ?? process.env.ADMIN_TOKEN ?? "";
}

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? getPassword();
}

function base64UrlEncode(buf: Uint8Array) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(str: string) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function sign(payloadB64: string, secret: string) {
  const mac = createHmac("sha256", secret).update(payloadB64).digest();
  return base64UrlEncode(mac);
}

export function createAdminSessionCookieValue(ttlSeconds = 60 * 60 * 24 * 30) {
  const password = getPassword();
  const secret = getSecret();
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");

  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now, exp: now + ttlSeconds };
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sigB64 = sign(payloadB64, secret);
  return `${payloadB64}.${sigB64}`;
}

export function verifyAdminSessionCookieValue(value: string | undefined) {
  try {
    const secret = getSecret();
    if (!secret) return false;
    if (!value) return false;
    const parts = value.split(".");
    if (parts.length !== 2) return false;
    const [payloadB64, sigB64] = parts;
    const expected = sign(payloadB64, secret);
    const a = Buffer.from(sigB64);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;

    const payloadJson = base64UrlDecode(payloadB64).toString("utf8");
    const payload = JSON.parse(payloadJson);
    if (typeof payload?.exp !== "number") return false;
    const now = Math.floor(Date.now() / 1000);
    return now < payload.exp;
  } catch {
    return false;
  }
}

export function getAdminCookieName() {
  return cookieName;
}

export function assertAdminPasswordConfigured() {
  if (!getPassword()) {
    throw new Error("ADMIN_PASSWORD is not set");
  }
}

export function isPasswordValid(password: string) {
  const expected = getPassword();
  if (!expected) return false;
  return password === expected;
}

