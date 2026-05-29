"use client";

import { Tabs as AnimalTabs } from "animal-island-ui";
import type { TabsProps as AnimalTabsProps } from "animal-island-ui";
import { cn } from "@/lib/utils";

export type AppTabsProps = AnimalTabsProps;

export function AppTabs({ className, leafAnimation = true, shadow = false, ...props }: AppTabsProps) {
  return (
    <AnimalTabs
      className={cn("zhizhi-app-tabs", className)}
      leafAnimation={leafAnimation}
      shadow={shadow}
      {...props}
    />
  );
}
