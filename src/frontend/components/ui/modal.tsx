"use client";

import { Modal as AnimalModal } from "animal-island-ui";
import type { ModalProps as AnimalModalProps } from "animal-island-ui";
import type { ReactNode } from "react";
import { AppButton } from "@/components/ui/button";
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

export type AppConfirmModalProps = {
  open: boolean;
  title?: ReactNode;
  description: ReactNode;
  detail?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  disabled?: boolean;
  tone?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
};

export function AppConfirmModal({
  open,
  title = "确认操作",
  description,
  detail,
  confirmText = "确定",
  cancelText = "取消",
  loading = false,
  disabled = false,
  tone = "default",
  onConfirm,
  onClose
}: AppConfirmModalProps) {
  return (
    <AppModal
      open={open}
      title={title}
      width={400}
      maskClosable={!loading}
      onClose={loading ? undefined : onClose}
      footer={
        <div className="zhizhi-confirm-modal-actions">
          <AppButton type="button" variant="secondary" disabled={loading} onClick={onClose}>
            {cancelText}
          </AppButton>
          <AppButton
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            disabled={disabled || loading}
            onClick={onConfirm}
          >
            {loading ? "处理中..." : confirmText}
          </AppButton>
        </div>
      }
      className={cn("zhizhi-confirm-modal", tone === "danger" && "zhizhi-confirm-modal-danger")}
    >
      <div className="zhizhi-confirm-modal-content">
        <div className="zhizhi-confirm-modal-mark" aria-hidden>
          !
        </div>
        <div className="zhizhi-confirm-modal-copy">
          <p>{description}</p>
          {detail ? <div className="zhizhi-confirm-modal-detail">{detail}</div> : null}
        </div>
      </div>
    </AppModal>
  );
}
