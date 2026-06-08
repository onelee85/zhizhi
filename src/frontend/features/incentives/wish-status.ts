import type { PointLedgerReason, WishStatus } from "@/features/tasks/types";

export const wishStatusLabel: Record<WishStatus, string> = {
  pending_review: "待设置积分",
  approved: "可兑换",
  rejected: "已驳回",
  redeem_requested: "待家长确认",
  redeemed: "已兑换"
};

export const wishStatusTone: Record<WishStatus, "success" | "warning" | "danger" | "lavender" | "neutral"> = {
  pending_review: "warning",
  approved: "success",
  rejected: "danger",
  redeem_requested: "lavender",
  redeemed: "neutral"
};

export const pointLedgerReasonLabel: Record<PointLedgerReason, string> = {
  task_reward: "任务奖励",
  wish_redeem: "心愿兑换",
  wish_refund: "心愿退款"
};
