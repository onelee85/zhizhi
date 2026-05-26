import { randomUUID } from "node:crypto";
import type { InMemoryDb } from "../../server/db.js";
import type { ParentReview, StudyTask, SubmissionImage, TaskSubmission } from "../../domain/types.js";

export class TaskRepository {
  constructor(private readonly db: InMemoryDb) {}

  findTaskById(taskId: string) {
    return this.db.tasks.find((task) => task.id === taskId);
  }

  listTodayTasks(familyId: string, childUserId: string, dueDate: string) {
    return this.db.tasks.filter(
      (task) => task.familyId === familyId && task.childUserId === childUserId && task.dueDate === dueDate
    );
  }

  createTask(input: Omit<StudyTask, "id" | "createdAt" | "updatedAt" | "status">) {
    const now = new Date().toISOString();
    const task: StudyTask = {
      id: randomUUID(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
      ...input
    };

    this.db.tasks.push(task);
    return task;
  }

  updateTask(taskId: string, patch: Partial<Pick<StudyTask, "subject" | "taskType" | "title" | "description" | "dueDate" | "dueTime" | "needPhoto" | "needAiCheck">>) {
    const task = this.findTaskById(taskId);

    if (!task) {
      return undefined;
    }

    Object.assign(task, patch, { updatedAt: new Date().toISOString() });
    return task;
  }

  deleteTask(taskId: string) {
    const index = this.db.tasks.findIndex((task) => task.id === taskId);

    if (index === -1) {
      return false;
    }

    this.db.tasks.splice(index, 1);
    return true;
  }

  setTaskStatus(taskId: string, status: StudyTask["status"]) {
    const task = this.findTaskById(taskId);

    if (!task) {
      return undefined;
    }

    task.status = status;
    task.updatedAt = new Date().toISOString();
    return task;
  }

  createSubmission(input: Omit<TaskSubmission, "id" | "submittedAt" | "createdAt" | "updatedAt">) {
    const now = new Date().toISOString();
    const submission: TaskSubmission = {
      id: randomUUID(),
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      ...input
    };

    this.db.submissions.push(submission);
    return submission;
  }

  listSubmissions(taskId: string) {
    return this.db.submissions.filter((submission) => submission.taskId === taskId);
  }

  getLatestSubmission(taskId: string) {
    return this.listSubmissions(taskId).at(-1);
  }

  createImages(submissionId: string, imageUrls: string[]) {
    const images: SubmissionImage[] = imageUrls.map((imageUrl, index) => ({
      id: randomUUID(),
      submissionId,
      imageUrl,
      imageThumbUrl: imageUrl,
      sortOrder: index,
      uploadStatus: "uploaded",
      createdAt: new Date().toISOString()
    }));

    this.db.images.push(...images);
    return images;
  }

  listImages(submissionId: string) {
    return this.db.images.filter((image) => image.submissionId === submissionId);
  }

  createReview(input: Omit<ParentReview, "id" | "reviewedAt">) {
    const review: ParentReview = {
      id: randomUUID(),
      reviewedAt: new Date().toISOString(),
      ...input
    };

    this.db.reviews.push(review);
    return review;
  }
}
