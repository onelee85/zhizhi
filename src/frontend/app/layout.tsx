import type { Metadata } from "next";
import Link from "next/link";
import "animal-island-ui/style";
import "./globals.css";
import { AuthProvider } from "@/features/auth/auth-context";
import { HeaderNav } from "@/features/auth/header-nav";

export const metadata: Metadata = {
  title: "知知小助手",
  description: "家庭学习任务打卡 MVP"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <header className="sticky top-0 z-50 border-b border-hairline bg-canvas/90 backdrop-blur-md">
            <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4">
              <Link href="/" className="flex items-center gap-3 text-title-md text-ink tracking-tight">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-ochre text-title-sm shadow-[inset_0_-2px_0_rgba(10,10,10,0.12)]">
                  知
                </span>
                <span>知知小助手</span>
              </Link>
              <HeaderNav />
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 py-8 md:py-12">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
