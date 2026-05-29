import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  variant = "default"
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "cream" | "pink" | "teal" | "lavender" | "peach" | "ochre";
}) {
  const variantStyles = {
    default: "bg-canvas border-hairline",
    cream: "bg-surface-card border-transparent",
    pink: "bg-brand-pink text-on-dark border-transparent",
    teal: "bg-brand-teal text-on-dark border-transparent",
    lavender: "bg-brand-lavender text-ink border-transparent",
    peach: "bg-brand-peach text-ink border-transparent",
    ochre: "bg-brand-ochre text-ink border-transparent"
  };

  return (
    <section
      className={cn(
        "rounded-xl border p-6 md:p-8",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-title-md text-ink", className)}>{children}</h2>;
}
