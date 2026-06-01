"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";

export function HeaderNav() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <nav className="flex items-center gap-3 text-nav-link text-muted">
        <span className="text-body-sm text-muted-soft">加载中...</span>
      </nav>
    );
  }

  if (user) {
    return (
      <nav className="flex flex-wrap items-center justify-end gap-2 text-nav-link text-muted">
        <Link
          href={user.role === "parent" ? "/parent" : "/child"}
          className="rounded-pill px-3 py-2 hover:bg-surface-card hover:text-ink transition-colors"
        >
          {user.role === "parent" ? "家长端" : "孩子端"}
        </Link>
        <Link
          href={user.role === "parent" ? "/parent/wishes" : "/child/wishes"}
          className="rounded-pill px-3 py-2 hover:bg-surface-card hover:text-ink transition-colors"
        >
          心愿单
        </Link>
        <span className="hidden text-body-sm text-ink sm:inline">{user.nickname}</span>
        <span className="rounded-full bg-brand-pink/15 px-3 py-1 text-caption font-medium text-ink">
          {user.role === "parent" ? "家长" : "孩子"}
        </span>
        <button
          onClick={logout}
          className="cursor-pointer rounded-md border border-hairline bg-canvas px-3 py-2 text-nav-link text-muted transition-colors hover:bg-surface-soft hover:text-ink"
        >
          退出登录
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex flex-wrap items-center justify-end gap-2 text-nav-link text-muted">
      <Link href="/parent" className="hidden rounded-pill px-3 py-2 transition-colors hover:bg-surface-card hover:text-ink sm:inline-flex">家长端</Link>
      <Link href="/child" className="hidden rounded-pill px-3 py-2 transition-colors hover:bg-surface-card hover:text-ink sm:inline-flex">孩子端</Link>
      <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-button text-on-primary transition-colors hover:bg-body-strong">登录</Link>
    </nav>
  );
}
