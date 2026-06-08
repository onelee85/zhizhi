import type { StudyTask, TaskStatus } from "./types";

export const todayTasks: StudyTask[] = [
  {
    id: "math-1",
    subject: "数学",
    taskType: "练习",
    title: "完成数学计算练习第 3 页",
    description: "完成第 3 页全部计算题，订正错题并圈出不会的题。",
    dueTime: "20:30",
    status: "parent_review",
    childNote: "第 5 题不确定。",
    imageCount: 2,
    aiSummary: "上传内容与数学练习基本匹配，大部分题目已完成，第 5 题建议家长复查。"
  },
  {
    id: "english-1",
    subject: "英语",
    taskType: "背诵",
    title: "默写 Unit 2 单词",
    description: "默写 Unit 2 重点单词 20 个，拍照上传默写纸。",
    dueTime: "21:00",
    status: "pending",
    imageCount: 0
  },
  {
    id: "chinese-1",
    subject: "语文",
    taskType: "阅读",
    title: "完成一篇阅读理解",
    description: "完成阅读理解一篇，标出不理解的题目。",
    dueTime: "21:20",
    status: "needs_resubmit",
    childNote: "已补做。",
    imageCount: 1,
    reviewNote: "图片偏模糊，请重新拍清楚题目和答案。"
  }
];

export const statusLabel: Record<TaskStatus, string> = {
  pending: "待完成",
  submitted: "已提交",
  ai_checking: "待家长确认",
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

export function getTask(taskId: string) {
  return todayTasks.find((task) => task.id === taskId) ?? todayTasks[0];
}
