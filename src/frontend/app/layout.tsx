import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "知知小助手",
  description: "家庭学习任务打卡 MVP"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold text-slate-950">
              知知小助手
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/login">登录</Link>
              <Link href="/parent">家长端</Link>
              <Link href="/child">孩子端</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
