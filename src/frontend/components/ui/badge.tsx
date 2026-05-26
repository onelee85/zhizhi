import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneClass = {
  neutral: "bg-slate-100 text-slate-700",
  warning: "bg-amber-100 text-amber-800",
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-rose-100 text-rose-800"
};

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: keyof typeof toneClass;
}) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", toneClass[tone])}>
      {children}
    </span>
  );
}
