import "./globals.css";
import { ThemeScript } from "./theme-script";

export const dynamic = "force-static";

export const metadata = {
  title: "科研技术向程序员个人主页",
  description:
    "科研与工程交叉方向的个人主页：研究方向、开源项目、论文出版、履历与联系方式。",
  openGraph: {
    title: "科研技术向程序员个人主页",
    description:
      "科研与工程交叉方向的个人主页：研究方向、开源项目、论文出版、履历与联系方式。",
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
