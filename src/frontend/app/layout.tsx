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
          <header className="sticky top-0 z-50 border-b border-hairline/80 bg-canvas/85 backdrop-blur-md">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-mint/40 to-transparent" />
            <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-6 px-4 md:px-6">
              <Link href="/" className="group flex items-center gap-3 text-ink">
                <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-ochre to-brand-peach text-title-md font-bold text-ink shadow-[inset_0_-3px_0_rgba(114,93,66,0.25)] transition-transform group-hover:-rotate-3">
                  知
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-mint ring-2 ring-canvas" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-title-md font-semibold tracking-tight">知知小助手</span>
                  <span className="text-caption text-muted-soft">家庭学习打卡</span>
                </span>
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
