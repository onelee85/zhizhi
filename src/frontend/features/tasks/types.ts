export type TaskStatus =
  | "pending"
  | "submitted"
  | "ai_checking"
  | "parent_review"
  | "confirmed"
  | "needs_resubmit";

export type StudyTask = {
  id: string;
  subject: "语文" | "数学" | "英语";
  taskType: "作业" | "预习" | "复习" | "错题" | "阅读" | "背诵" | "练习";
  title: string;
  description: string;
  dueTime: string;
  status: TaskStatus;
  childNote?: string;
  imageCount: number;
  aiSummary?: string;
  reviewNote?: string;
};
