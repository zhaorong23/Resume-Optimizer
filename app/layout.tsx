import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 简历优化与面试准备",
  description:
    "面向产品经理 & 产品运营求职者（含校招/实习）的 JD 驱动简历优化与面试准备工具。支持 PDF / Word / 扫描件输入。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
