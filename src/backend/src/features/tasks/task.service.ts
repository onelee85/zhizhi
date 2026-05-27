import { AppError, assertFound } from "../../shared/errors.js";
import type { StudyTask, User } from "../../domain/types.js";
import type { TaskRepository } from "./task.repository.js";
import type { z } from "zod";
import type { createTaskSchema, reviewTaskSchema, submitTaskSchema, updateTaskSchema } from "./task.schemas.js";

type CreateTaskInput = z.infer<typeof createTaskSchema>;
type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
type SubmitTaskInput = z.infer<typeof submitTaskSchema>;
type ReviewTaskInput = z.infer<typeof reviewTaskSchema>;

export class TaskService {
  constructor(private readonly repository: TaskRepository) {}

  async listTodayTasks(user: User) {
    const today = new Date().toISOString().slice(0, 10);
    const tasks =
      user.role === "child"
        ? await this.repository.listTodayTasks(user.familyId, user.id, today)
        : await this.repository.listFamilyTodayTasks(user.familyId, today);

    return Promise.all(tasks.map((task) => this.withSubmission(task)));
  }

  async getTask(user: User, taskId: string) {
    const task = assertFound(await this.repository.findTaskById(taskId), "Task not found");
    this.assertFamilyAccess(user, task);
    return this.withSubmission(task);
  }

  async createTask(parent: User, input: CreateTaskInput) {
    if (parent.role !== "parent") {
      throw new AppError(403, "FORBIDDEN", "Only parents can create tasks");
    }

    if (!(await this.repository.isFamilyChild(parent.familyId, input.childUserId))) {
      throw new AppError(403, "FORBIDDEN", "Child is outside current family");
    }

    return this.repository.createTask({
      familyId: parent.familyId,
      childUserId: input.childUserId,
      creatorUserId: parent.id,
      subject: input.subject,
      taskType: input.taskType,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      dueTime: input.dueTime,
      needPhoto: input.needPhoto,
      needAiCheck: input.needAiCheck
    });
  }

  async updateTask(parent: User, taskId: string, input: UpdateTaskInput) {
    const task = assertFound(await this.repository.findTaskById(taskId), "Task not found");
    this.assertParentFamilyAccess(parent, task);

    if (task.status !== "pending") {
      throw new AppError(409, "TASK_NOT_EDITABLE", "Only pending tasks can be edited");
    }

    return this.repository.updateTask(taskId, input);
  }

  async deleteTask(parent: User, taskId: string) {
    const task = assertFound(await this.repository.findTaskById(taskId), "Task not found");
    this.assertParentFamilyAccess(parent, task);

    if (task.status !== "pending") {
      throw new AppError(409, "TASK_NOT_DELETABLE", "Only pending tasks can be deleted");
    }

    await this.repository.deleteTask(taskId);
  }

  async submitTask(child: User, taskId: string, input: SubmitTaskInput) {
    const task = assertFound(await this.repository.findTaskById(taskId), "Task not found");

    if (child.role !== "child" || task.childUserId !== child.id || task.familyId !== child.familyId) {
      throw new AppError(403, "FORBIDDEN", "Child cannot submit this task");
    }

    if (task.status !== "pending" && task.status !== "needs_resubmit") {
      throw new AppError(409, "TASK_NOT_SUBMITTABLE", "Task cannot be submitted in current status");
    }

    const submission = await this.repository.createSubmission({
      taskId,
      childUserId: child.id,
      status: "submitted",
      childNote: input.childNote
    });
    const images = await this.repository.createImages(submission.id, input.imageUrls);
    const nextStatus = task.needAiCheck ? "ai_checking" : "parent_review";
    const updatedTask = await this.repository.setTaskStatus(taskId, nextStatus);

    return {
      task: updatedTask,
      submission,
      images
    };
  }

  async reviewTask(parent: User, taskId: string, input: ReviewTaskInput) {
    const task = assertFound(await this.repository.findTaskById(taskId), "Task not found");
    this.assertParentFamilyAccess(parent, task);

    const submission = assertFound(await this.repository.getLatestSubmission(taskId), "Submission not found");
    const review = await this.repository.createReview({
      taskId,
      submissionId: submission.id,
      parentUserId: parent.id,
      reviewResult: input.reviewResult,
      comment: input.comment
    });

    const taskStatus = input.reviewResult === "pass" ? "confirmed" : "needs_resubmit";
    const submissionStatus = input.reviewResult === "pass" ? "parent_confirmed" : "needs_resubmit";

    await this.repository.setTaskStatus(taskId, taskStatus);
    await this.repository.updateSubmissionStatus(submission.id, submissionStatus);
    submission.status = submissionStatus;
    submission.updatedAt = new Date().toISOString();

    return {
      task: await this.repository.findTaskById(taskId),
      submission,
      review
    };
  }

  async getParentDashboard(parent: User) {
    if (parent.role !== "parent") {
      throw new AppError(403, "FORBIDDEN", "Only parents can view dashboard");
    }

    const tasks = await Promise.all(
      (await this.repository.listFamilyTasks(parent.familyId)).map((task) => this.withSubmission(task))
    );
    const summary = {
      total: tasks.length,
      confirmed: tasks.filter((task) => task.status === "confirmed").length,
      pending: tasks.filter((task) => task.status === "pending").length,
      needsResubmit: tasks.filter((task) => task.status === "needs_resubmit").length,
      waitingReview: tasks.filter((task) => task.status === "parent_review").length
    };

    return {
      summary,
      tasks
    };
  }

  private async withSubmission(task: StudyTask) {
    const submission = await this.repository.getLatestSubmission(task.id);
    const images = submission ? await this.repository.listImages(submission.id) : [];

    return {
      ...task,
      submission: submission
        ? {
            ...submission,
            images
          }
        : null
    };
  }

  private assertFamilyAccess(user: User, task: StudyTask) {
    if (user.familyId !== task.familyId) {
      throw new AppError(403, "FORBIDDEN", "Task is outside current family");
    }

    if (user.role === "child" && task.childUserId !== user.id) {
      throw new AppError(403, "FORBIDDEN", "Child cannot access this task");
    }
  }

  private assertParentFamilyAccess(parent: User, task: StudyTask) {
    if (parent.role !== "parent" || parent.familyId !== task.familyId) {
      throw new AppError(403, "FORBIDDEN", "Parent cannot access this task");
    }
  }
}
