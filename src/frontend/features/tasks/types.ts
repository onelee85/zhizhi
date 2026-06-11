export type TaskStatus =
  | "pending"
  | "parent_review"
  | "confirmed"
  | "needs_resubmit";

export type Subject = "语文" | "数学" | "英语" | "其他";

export type TaskType = "作业" | "预习" | "复习" | "错题" | "阅读" | "背诵" | "练习";

export type UserRole = "parent" | "child";

export type User = {
  id: string;
  familyId: string;
  role: UserRole;
  username: string;
  nickname: string;
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

export type TaskSubmission = {
  id: string;
  taskId: string;
  childUserId: string;
  status: "submitted" | "parent_confirmed" | "needs_resubmit";
  childNote?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  images: SubmissionImage[];
  review: {
    reviewResult: "pass" | "need_resubmit";
    comment?: string;
    reviewedAt: string;
  } | null;
};

export type StudyTask = {
  id: string;
  familyId?: string;
  childUserId?: string;
  creatorUserId?: string;
  subject: Subject;
  taskType: TaskType;
  title: string;
  description: string;
  note?: string;
  dueDate?: string;
  dueTime?: string;
  needPhoto?: boolean;
  rewardPoints?: number;
  status: TaskStatus;
  isOverdue?: boolean;
  isArchived?: boolean;
  confirmedAt?: string | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  submission?: TaskSubmission | null;
  submissions?: TaskSubmission[];
  imageCount?: number;
  latestReview?: {
    reviewResult: "pass" | "need_resubmit";
    comment?: string;
    reviewedAt: string;
  } | null;
};

export type ParentDashboardChild = {
  id: string;
  nickname: string;
  pendingCount: number;
  submittedCount: number;
  confirmedCount: number;
};

export type ParentDashboardSummary = {
  total: number;
  confirmed: number;
  pending: number;
  needsResubmit: number;
  waitingReview: number;
};

export type ParentDashboard = {
  summary: ParentDashboardSummary;
  tasks: StudyTask[];
  child: {
    id: string;
    nickname: string;
  };
  pointAccount: ChildPointAccount;
  metrics: MvpMetrics;
};

export type PointLedgerReason = "task_reward" | "wish_redeem" | "wish_refund";

export type PointLedger = {
  id: string;
  familyId: string;
  childUserId: string;
  changeAmount: number;
  balanceAfter: number;
  reason: PointLedgerReason;
  sourceType: "task_review" | "wish";
  sourceId: string;
  operatorUserId: string;
  createdAt: string;
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

export type WishStatus = "pending_review" | "approved" | "rejected" | "redeem_requested" | "redeemed";

export type WishRedeemRequest = {
  id: string;
  wishId: string;
  familyId: string;
  childUserId: string;
  requiredPoints: number;
  status: "pending" | "confirmed" | "rejected";
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

export type MvpMetrics = {
  days: number;
  counts: {
    createdTasks: number;
    taskCreationDays: number;
    dueTasks: number;
    submittedTasks: number;
    confirmedTasks: number;
    confirmedWithin24h: number;
    resubmitRequests: number;
    resubmittedTasks: number;
    wishesCreated: number;
    wishesApproved: number;
    wishesRejected: number;
    redeemRequested: number;
    redeemConfirmed: number;
    redeemRejected: number;
    wishesRedeemed: number;
  };
  rates: {
    checkInCompletion: number;
    confirmedWithin24h: number;
    resubmitCompletion: number;
  };
};
