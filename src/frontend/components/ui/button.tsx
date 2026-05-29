"use client";

import Link from "next/link";
import { Button as AnimalButton } from "animal-island-ui";
import type { ButtonProps as AnimalButtonProps, ButtonSize } from "animal-island-ui";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";

export type AppButtonProps = Omit<AnimalButtonProps, "type" | "htmlType" | "size" | "danger"> & {
  variant?: AppButtonVariant;
  size?: ButtonSize;
  type?: "submit" | "reset" | "button";
};

const variantClass: Record<AppButtonVariant, string> = {
  primary: "zhizhi-app-button-primary",
  secondary: "zhizhi-app-button-secondary",
  ghost: "zhizhi-app-button-ghost",
  danger: "zhizhi-app-button-danger",
  link: "zhizhi-app-button-link"
};

const variantType: Record<AppButtonVariant, AnimalButtonProps["type"]> = {
  primary: "primary",
  secondary: "default",
  ghost: "text",
  danger: "primary",
  link: "link"
};

export function AppButton({ className, variant = "primary", size = "middle", type = "button", ...props }: AppButtonProps) {
  return (
    <AnimalButton
      className={cn("zhizhi-app-button", variantClass[variant], className)}
      danger={variant === "danger"}
      htmlType={type}
      size={size}
      type={variantType[variant]}
      {...props}
    />
  );
}

export type AppButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: AppButtonVariant;
  size?: ButtonSize;
};

export function AppButtonLink({
  href,
  children,
  className,
  variant = "primary",
  size = "middle",
  ...props
}: AppButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "zhizhi-app-button-link-shell",
        size === "large" && "zhizhi-app-button-link-shell-large",
        size === "small" && "zhizhi-app-button-link-shell-small",
        variantClass[variant],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export const Button = AppButton;
export const ButtonLink = AppButtonLink;
