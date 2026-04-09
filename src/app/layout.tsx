import type { Metadata } from "next";

import "./globals.css";
import { ThemeScript } from "./theme-script";

export const dynamic = "force-static";

const metadataBase = (() => {
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (publicSiteUrl) return new URL(publicSiteUrl);

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return new URL(`https://${vercelUrl}`);

  const netlifyUrl =
    process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? process.env.NETLIFY_URL;
  if (netlifyUrl) return new URL(netlifyUrl);

  return new URL("http://localhost:3000");
})();

export const metadata: Metadata = {
  metadataBase,
  title: "徐煜辰 | 科研技术向个人主页",
  description: "科研与工程交叉方向的个人主页：研究方向、开源项目、论文出版、履历与联系方式。",
  openGraph: {
    title: "徐煜辰 | 科研技术向个人主页",
    description: "科研与工程交叉方向的个人主页：研究方向、开源项目、论文出版、履历与联系方式。",
    type: "website",
    images: [{ url: "/og.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
