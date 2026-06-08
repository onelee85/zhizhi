import type { Metadata } from "next";
import Link from "next/link";
import "animal-island-ui/style";
import "./globals.css";
import { BrandLogo } from "@/components/ui/brand-logo";
import { AuthProvider } from "@/features/auth/auth-context";
import { HeaderNav } from "@/features/auth/header-nav";

export const metadata: Metadata = {
  title: {
    default: "知知小助手",
    template: "%s | 知知小助手"
  },
  description: "把任务、打卡与温柔反馈收进同一张家庭学习地图。",
  applicationName: "知知小助手",
  icons: {
    icon: [{ url: "/brand/zhizhi-mark.svg", type: "image/svg+xml" }],
    shortcut: "/brand/zhizhi-mark.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <header className="sticky top-0 z-50 border-b border-hairline/80 bg-canvas/95 md:bg-canvas/85 md:backdrop-blur-md">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-mint/40 to-transparent" />
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:min-h-[72px] md:px-6">
              <Link href="/" className="group flex items-center gap-3 text-ink">
                <BrandLogo
                  priority
                  className="h-11 w-11 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105"
                />
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="text-title-md font-semibold tracking-tight">知知小助手</span>
                  <span className="text-caption text-muted-soft">家庭学习打卡</span>
                </span>
              </Link>
              <HeaderNav />
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:py-12">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
