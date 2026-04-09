import type { NextConfig } from "next";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFileFallback(fileName: string) {
  try {
    const fullPath = resolve(process.cwd(), fileName);
    const raw = readFileSync(fullPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      if (!key) continue;
      if (process.env[key]) continue;
      let value = trimmed.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    return;
  }
}

if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  if (!process.env.ADMIN_PASSWORD) {
    loadEnvFileFallback(".env.local");
    loadEnvFileFallback(".env");
    loadEnvFileFallback(".env.example");
  }
  if (!process.env.DATABASE_URL) {
    loadEnvFileFallback(".env.local");
    loadEnvFileFallback(".env");
  }
}

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();
const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");

const nextConfig: NextConfig = {
  trailingSlash: true,
  basePath: normalizedBasePath || undefined,
  assetPrefix: normalizedBasePath ? `${normalizedBasePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
