import type { NextConfig } from "next";

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();
const normalizedBasePath = basePath === "/" ? "" : basePath.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: normalizedBasePath || undefined,
  assetPrefix: normalizedBasePath ? `${normalizedBasePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
