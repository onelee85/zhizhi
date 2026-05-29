"use client";

import { Card as AnimalCard } from "animal-island-ui";
import type { CardColor, CardProps as AnimalCardProps, CardType } from "animal-island-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppCardVariant = "default" | "cream" | "pink" | "teal" | "lavender" | "peach" | "ochre" | "mint" | "dashed";

export type AppCardProps = Omit<AnimalCardProps, "color" | "type"> & {
  children: ReactNode;
  className?: string;
  variant?: AppCardVariant;
  color?: CardColor;
  cardType?: CardType;
};

const variantColor: Record<AppCardVariant, CardColor> = {
  default: "default",
  cream: "default",
  pink: "app-pink",
  teal: "app-teal",
  lavender: "purple",
  peach: "warm-peach-pink",
  ochre: "app-yellow",
  mint: "app-green",
  dashed: "default"
};

export function AppCard({
  children,
  className,
  variant = "default",
  color,
  cardType,
  ...props
}: AppCardProps) {
  return (
    <AnimalCard
      className={cn("zhizhi-app-card", variant === "cream" && "zhizhi-app-card-cream", className)}
      color={color ?? variantColor[variant]}
      type={cardType ?? (variant === "dashed" ? "dashed" : "default")}
      {...props}
    >
      {children}
    </AnimalCard>
  );
}

export function AppCardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-title-md text-ink", className)}>{children}</h2>;
}

export const Card = AppCard;
export const CardTitle = AppCardTitle;
