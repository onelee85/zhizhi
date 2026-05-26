import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneClass = {
  neutral: "bg-surface-card text-body",
  warning: "bg-brand-ochre/30 text-ink",
  success: "bg-brand-mint/50 text-ink",
  danger: "bg-brand-coral/20 text-ink",
  pink: "bg-brand-pink/20 text-ink",
  lavender: "bg-brand-lavender/40 text-ink",
  peach: "bg-brand-peach/30 text-ink"
};

export function Badge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: keyof typeof toneClass;
}) {
  return (
    <span className={cn("inline-flex rounded-pill px-3 py-1 text-caption", toneClass[tone])}>
      {children}
    </span>
  );
}
