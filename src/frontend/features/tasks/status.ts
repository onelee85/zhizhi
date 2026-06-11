import type { TaskStatus } from "./types";

export const statusLabel: Record<TaskStatus, string> = {
  pending: "待完成",
  parent_review: "待家长确认",
  confirmed: "家长已确认",
  needs_resubmit: "需补充"
};

export const statusTone: Record<TaskStatus, "neutral" | "warning" | "success" | "danger"> = {
  pending: "neutral",
  parent_review: "warning",
  confirmed: "success",
  needs_resubmit: "danger"
};

export function getTaskStatusLabel(task: { status: TaskStatus; isOverdue?: boolean }) {
  return task.isOverdue ? "已过期" : statusLabel[task.status];
}

export function getTaskStatusTone(task: { status: TaskStatus; isOverdue?: boolean }) {
  return task.isOverdue ? "danger" : statusTone[task.status];
}

export function getImageCount(task: { imageCount?: number; submission?: { images: unknown[] } | null }) {
  return task.submission?.images.length ?? task.imageCount ?? 0;
}
