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
        <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-title-md text-ink tracking-tight">
              知知小助手
            </Link>
            <nav className="flex items-center gap-6 text-nav-link text-muted">
              <Link href="/login" className="hover:text-ink transition-colors">登录</Link>
              <Link href="/parent" className="hover:text-ink transition-colors">家长端</Link>
              <Link href="/child" className="hover:text-ink transition-colors">孩子端</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
