export type UserRole = "parent" | "child";

export type User = {
  id: string;
  familyId: string;
  role: UserRole;
  username: string;
  password: string;
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
