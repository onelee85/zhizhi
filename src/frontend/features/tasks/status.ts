import type { TaskStatus } from "./types";

export const statusLabel: Record<TaskStatus, string> = {
  pending: "待完成",
  submitted: "已提交",
  ai_checking: "AI 检查中",
  parent_review: "待家长确认",
  confirmed: "家长已确认",
  needs_resubmit: "需补充"
};

export const statusTone: Record<TaskStatus, "neutral" | "warning" | "success" | "danger"> = {
  pending: "neutral",
  submitted: "warning",
  ai_checking: "warning",
  parent_review: "warning",
  confirmed: "success",
  needs_resubmit: "danger"
};

export function getImageCount(task: { imageCount?: number; submission?: { images: unknown[] } | null }) {
  return task.submission?.images.length ?? task.imageCount ?? 0;
}
