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
  note?: string;
  dueDate: string;
  dueTime?: string;
  needPhoto: boolean;
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

export type LatestReview = Pick<ParentReview, "reviewResult" | "comment" | "reviewedAt">;

export type TaskSubmissionDetail = TaskSubmission & {
  images: SubmissionImage[];
  review: LatestReview | null;
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
  reason: "task_reward" | "wish_redeem" | "wish_refund";
  sourceType: "task_review" | "wish";
  sourceId: string;
  operatorUserId: string;
  createdAt: string;
};

export type WishStatus = "pending_review" | "approved" | "rejected" | "redeem_requested" | "redeemed";

export type WishRedeemRequestStatus = "pending" | "confirmed" | "rejected";

export type WishRedeemRequest = {
  id: string;
  wishId: string;
  familyId: string;
  childUserId: string;
  requiredPoints: number;
  status: WishRedeemRequestStatus;
  rejectReason?: string;
  parentUserId?: string;
  requestedAt: string;
  resolvedAt?: string;
};

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
  currentRedeemRequestId?: string;
  latestRedeemRequest?: WishRedeemRequest;
  createdAt: string;
  updatedAt: string;
  redeemedAt?: string;
};

export type FamilyContext = {
  family: {
    id: string;
    name: string;
  };
  child: {
    id: string;
    nickname: string;
  };
};

export type ProductEventName =
  | "task_created"
  | "task_submitted"
  | "task_confirmed"
  | "task_resubmit_requested"
  | "wish_created"
  | "wish_approved"
  | "wish_rejected"
  | "wish_redeem_requested"
  | "wish_redeem_confirmed"
  | "wish_redeem_rejected";
