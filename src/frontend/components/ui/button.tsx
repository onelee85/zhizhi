import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variantClass = {
  primary: "bg-ink text-on-primary hover:bg-body-strong",
  secondary: "border border-hairline bg-canvas text-ink hover:bg-surface-soft",
  ghost: "text-body hover:bg-surface-soft"
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
