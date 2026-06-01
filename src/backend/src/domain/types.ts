export type UserRole = "parent" | "child";

export type User = {
  id: string;
  familyId: string;
  role: UserRole;
  username: string;
  passwordHash: string;
  nickname: string;
};

export type TaskStatus =
  | "pending"
  | "submitted"
  | "ai_checking"
  | "parent_review"
  | "confirmed"
  | "needs_resubmit";

export type StudyTask = {
  id: string;
  familyId: string;
  childUserId: string;
  creatorUserId: string;
  subject: "语文" | "数学" | "英语" | "其他";
  taskType: "作业" | "预习" | "复习" | "错题" | "阅读" | "背诵" | "练习";
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  needPhoto: boolean;
  needAiCheck: boolean;
  rewardPoints: number;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type TaskSubmission = {
  id: string;
  taskId: string;
  childUserId: string;
  status: "submitted" | "parent_confirmed" | "needs_resubmit";
  childNote?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionImage = {
  id: string;
  submissionId: string;
  imageUrl: string;
  imageThumbUrl?: string;
  sortOrder: number;
  uploadStatus: "uploaded";
  createdAt: string;
};

export type ParentReview = {
  id: string;
  taskId: string;
  submissionId: string;
  parentUserId: string;
  reviewResult: "pass" | "need_resubmit";
  comment?: string;
  reviewedAt: string;
};

export type ChildPointAccount = {
  id: string;
  familyId: string;
  childUserId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
};

export type PointLedger = {
  id: string;
  familyId: string;
  childUserId: string;
  changeAmount: number;
  balanceAfter: number;
  reason: "task_reward" | "wish_redeem";
  sourceType: "task_review" | "wish";
  sourceId: string;
  operatorUserId: string;
  createdAt: string;
};

export type WishStatus = "pending_review" | "approved" | "rejected" | "redeem_requested" | "redeemed";

export type Wish = {
  id: string;
  familyId: string;
  childUserId: string;
  title: string;
  description?: string;
  requiredPoints?: number;
  status: WishStatus;
  parentUserId?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  redeemedAt?: string;
};
