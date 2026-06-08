"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "animal-island-ui";
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
    const roleLabel = user.role === "parent" ? "家长" : "孩子";
    const displayName = user.nickname.includes("Demo") ? roleLabel : user.nickname;
    const dashboardHref = user.role === "parent" ? "/parent" : "/child";
    const wishlistHref = user.role === "parent" ? "/parent/wishes" : "/child/wishes";
    const calendarHref = user.role === "parent" ? "/parent/calendar" : "/child/calendar";
    const items: NavItem[] = [
      {
        href: dashboardHref,
        label: "任务清单",
        icon: "icon-map",
        match: (path) => {
          if (path === dashboardHref) return true;
          if (!path.startsWith(`${dashboardHref}/`)) return false;
          return !path.startsWith(wishlistHref) && !path.startsWith(calendarHref);
        }
      },
      {
        href: calendarHref,
        label: "日历",
        icon: "icon-map",
        match: (path) => path === calendarHref || path.startsWith(`${calendarHref}/`)
      },
      {
        href: wishlistHref,
        label: "心愿单",
        icon: "icon-shopping",
        match: (path) => path === wishlistHref || path.startsWith(`${wishlistHref}/`)
      }
    ];

    return (
      <nav className="flex items-center justify-end gap-2">
        <div className="fixed inset-x-3 bottom-3 z-[60] grid h-16 grid-cols-3 items-center rounded-[24px] border-2 border-[#eadfc3] bg-[#fffdf2]/95 p-1.5 shadow-[0_8px_24px_rgba(114,93,66,0.18)] backdrop-blur-md md:static md:flex md:h-auto md:rounded-full md:border md:bg-canvas/80 md:p-1 md:shadow-[inset_0_-2px_0_rgba(114,93,66,0.06)]">
          {items.map((item) => (
            <HeaderNavLink key={item.href} item={item} active={item.match(pathname)} />
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-hairline/70 bg-canvas/80 p-1 pr-2 shadow-[inset_0_-2px_0_rgba(114,93,66,0.06)]">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-ochre text-caption font-bold text-ink shadow-[inset_0_-2px_0_rgba(114,93,66,0.18)]">
            {displayName.charAt(0)}
          </span>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-body-sm font-semibold text-ink">{displayName}</span>
            <span className="text-caption text-muted-soft">{roleLabel}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="cursor-pointer rounded-full border border-hairline/70 bg-canvas/80 px-3 py-2 text-caption font-bold text-muted transition-colors hover:border-brand-coral/40 hover:bg-brand-coral/10 hover:text-brand-coral md:px-4 md:text-nav-link"
        >
          退出
        </button>
      </nav>
    );
  }

  return null;
}

function HeaderNavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-1 text-caption font-bold transition-all md:inline-flex md:h-auto md:flex-row md:gap-2 md:rounded-full md:px-3.5 md:py-2 md:text-nav-link",
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
      <span>{item.label === "任务清单" ? "任务" : item.label === "心愿单" ? "心愿" : item.label}</span>
    </Link>
  );
}
