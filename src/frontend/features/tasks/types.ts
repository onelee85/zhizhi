export type TaskStatus =
  | "pending"
  | "submitted"
  | "ai_checking"
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
  dueDate?: string;
  dueTime?: string;
  needPhoto?: boolean;
  needAiCheck?: boolean;
  status: TaskStatus;
  createdAt?: string;
  updatedAt?: string;
  submission?: TaskSubmission | null;
  childNote?: string;
  imageCount: number;
  aiSummary?: string;
  reviewNote?: string;
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
};
