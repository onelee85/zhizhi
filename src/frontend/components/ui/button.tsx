import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variantClass = {
  primary: "bg-ink text-on-primary shadow-[inset_0_-2px_0_rgba(255,255,255,0.14)] hover:bg-body-strong",
  secondary: "border border-hairline bg-canvas text-ink shadow-[inset_0_-1px_0_rgba(10,10,10,0.04)] hover:bg-surface-soft",
  ghost: "text-body hover:bg-surface-soft hover:text-ink"
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-md px-5 text-button transition disabled:cursor-not-allowed disabled:opacity-40",
        variantClass[variant],
        className
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
};

export function ButtonLink({
  href,
  children,
  className,
  variant = "primary"
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-md px-5 text-button transition",
        variantClass[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
