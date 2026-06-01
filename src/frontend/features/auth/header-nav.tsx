"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "animal-island-ui";
import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  match: (pathname: string) => boolean;
};

export function HeaderNav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname() ?? "";

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-body-sm text-muted-soft">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-mint" />
        加载中...
      </div>
    );
  }

  if (user) {
    const dashboardHref = user.role === "parent" ? "/parent" : "/child";
    const wishlistHref = user.role === "parent" ? "/parent/wishes" : "/child/wishes";
    const items: NavItem[] = [
      {
        href: dashboardHref,
        label: "任务清单",
        icon: "icon-map",
        match: (path) => {
          if (path === dashboardHref) return true;
          if (!path.startsWith(`${dashboardHref}/`)) return false;
          return !path.startsWith(wishlistHref);
        }
      },
      {
        href: wishlistHref,
        label: "心愿单",
        icon: "icon-shopping",
        match: (path) => path === wishlistHref || path.startsWith(`${wishlistHref}/`)
      }
    ];

    return (
      <nav className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-1 rounded-full border border-hairline/70 bg-canvas/80 p-1 shadow-[inset_0_-2px_0_rgba(114,93,66,0.06)]">
          {items.map((item) => (
            <HeaderNavLink key={item.href} item={item} active={item.match(pathname)} />
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-hairline/70 bg-canvas/80 py-1 pl-1 pr-2 shadow-[inset_0_-2px_0_rgba(114,93,66,0.06)]">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-ochre text-caption font-bold text-ink shadow-[inset_0_-2px_0_rgba(114,93,66,0.18)]">
            {user.nickname.charAt(0)}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-body-sm font-semibold text-ink">{user.nickname}</span>
            <span className="text-caption text-muted-soft">{user.role === "parent" ? "家长" : "孩子"}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="cursor-pointer rounded-full border border-hairline/70 bg-canvas/80 px-4 py-2 text-nav-link text-muted transition-colors hover:border-brand-coral/40 hover:bg-brand-coral/10 hover:text-brand-coral"
        >
          退出登录
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href="/login"
        className="hidden rounded-full border border-hairline/70 bg-canvas/80 px-4 py-2 text-nav-link text-muted transition-colors hover:border-brand-mint/50 hover:bg-brand-mint/10 hover:text-ink sm:inline-flex"
      >
        任务清单
      </Link>
      <Link
        href="/login"
        className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-button text-on-primary shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)] transition-colors hover:bg-body-strong"
      >
        登录
      </Link>
    </nav>
  );
}

function HeaderNavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-nav-link transition-all",
        active
          ? "bg-brand-mint/30 text-ink shadow-[inset_0_-2px_0_rgba(68,129,111,0.25)]"
          : "text-muted hover:bg-surface-card hover:text-ink"
      )}
    >
      <Icon
        name={item.icon}
        size={16}
        className={cn("transition-colors", active ? "text-brand-teal" : "text-muted-soft")}
      />
      <span>{item.label}</span>
    </Link>
  );
}
