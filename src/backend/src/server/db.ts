import type { ParentReview, StudyTask, SubmissionImage, TaskSubmission, User } from "../domain/types.js";

export type InMemoryDb = {
  users: User[];
  tasks: StudyTask[];
  submissions: TaskSubmission[];
  images: SubmissionImage[];
  reviews: ParentReview[];
};

const now = new Date().toISOString();
const today = new Date().toISOString().slice(0, 10);

export const db: InMemoryDb = {
  users: [
    {
      id: "parent-1",
      familyId: "family-1",
      role: "parent",
      username: "parent_demo",
      password: "password123",
      nickname: "家长 Demo"
    },
    {
      id: "child-1",
      familyId: "family-1",
      role: "child",
      username: "child_demo",
      password: "password123",
      nickname: "孩子 Demo"
    }
  ],
  tasks: [
    {
      id: "task-math-1",
      familyId: "family-1",
      childUserId: "child-1",
      creatorUserId: "parent-1",
      subject: "数学",
      taskType: "练习",
      title: "完成数学计算练习第 3 页",
      description: "完成第 3 页全部计算题，订正错题并圈出不会的题。",
      dueDate: today,
      dueTime: "20:30",
      needPhoto: true,
      needAiCheck: false,
      status: "pending",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "task-english-1",
      familyId: "family-1",
      childUserId: "child-1",
      creatorUserId: "parent-1",
      subject: "英语",
      taskType: "背诵",
      title: "默写 Unit 2 单词",
      description: "默写 Unit 2 重点单词 20 个，拍照上传默写纸。",
      dueDate: today,
      dueTime: "21:00",
      needPhoto: true,
      needAiCheck: false,
      status: "pending",
      createdAt: now,
      updatedAt: now
    }
  ],
  submissions: [],
  images: [],
  reviews: []
};
