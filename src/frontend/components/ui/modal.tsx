"use client";

import { Modal as AnimalModal } from "animal-island-ui";
import type { ModalProps as AnimalModalProps } from "animal-island-ui";
import { cn } from "@/lib/utils";

export type AppModalProps = AnimalModalProps;

export function AppModal({ className, typewriter = false, width = 420, ...props }: AppModalProps) {
  return (
    <AnimalModal
      className={cn("zhizhi-app-modal", className)}
      typewriter={typewriter}
      width={width}
      {...props}
    />
  );
}
