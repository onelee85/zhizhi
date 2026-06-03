import { AppError, assertFound } from "../../shared/errors.js";
import { deleteLocalFile } from "../../server/uploads.js";
import type { StudyTask, User } from "../../domain/types.js";
import type { TaskRepository } from "./task.repository.js";
import type { IncentiveService } from "../incentives/incentive.service.js";
import type { z } from "zod";
import type {
  calendarTaskQuerySchema,
  createTaskSchema,
  historyTaskQuerySchema,
  reviewTaskSchema,
  submitTaskSchema,
  updateTaskSchema
} from "./task.schemas.js";

type CreateTaskInput = z.infer<typeof createTaskSchema>;
type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
type SubmitTaskInput = z.infer<typeof submitTaskSchema>;
type ReviewTaskInput = z.infer<typeof reviewTaskSchema>;
type CalendarTaskQuery = z.infer<typeof calendarTaskQuerySchema>;
type HistoryTaskQuery = z.infer<typeof historyTaskQuerySchema>;

export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly incentiveService?: IncentiveService
  ) {}

  async listTodayTasks(
    user: User,
    options: { includeOverdueIncomplete?: boolean; includeCompleted?: boolean } = {}
  ) {
    const today = new Date().toISOString().slice(0, 10);
    const tasks =
      user.role === "child"
        ? await this.repository.listTodayTasks(user.familyId, user.id, today, options)
        : await this.repository.listFamilyTodayTasks(user.familyId, today);

    return this.excludeArchived(await Promise.all(tasks.map((task) => this.withSubmission(task))));
  }

  async getTask(user: User, taskId: string) {
    const task = assertFound(await this.repository.findTaskById(taskId), "Task not found");
    this.assertFamilyAccess(user, task);
    return this.withSubmission(task);
  }

  async listCalendarTasks(user: User, query: CalendarTaskQuery) {
    const { startDate, endDate } = getMonthRange(query.month);
    const tasks =
      user.role === "child"
        ? await this.repository.listChildTasksByDateRange(user.familyId, user.id, startDate, endDate)
        : await this.repository.listFamilyTasksByDateRange(user.familyId, startDate, endDate);

    return Promise.all(tasks.map((task) => this.withSubmission(task)));
  }

  async listHistoryTasks(user: User, query: HistoryTaskQuery) {
    if (user.role === "child" && query.childUserId && query.childUserId !== user.id) {
      throw new AppError(403, "FORBIDDEN", "Child cannot access another child's history");
    }

    if (user.role === "parent" && query.childUserId) {
      if (!(await this.repository.isFamilyChild(user.familyId, query.childUserId))) {
        throw new AppError(403, "FORBIDDEN", "Child is outside current family");
      }
    }

    const tasks = await this.repository.listFamilyTasks(user.familyId);

    const childUserId = user.role === "child" ? user.id : query.childUserId;
    const filteredTasks = tasks.filter((task) => {
      if (childUserId && task.childUserId !== childUserId) {
        return false;
      }

      if (query.startDate && task.dueDate < query.startDate) {
        return false;
      }

      if (query.endDate && task.dueDate > query.endDate) {
        return false;
      }

      return true;
    });

    const enrichedTasks = await Promise.all(filteredTasks.map((task) => this.withSubmission(task)));

    return enrichedTasks
      .filter((task) => task.isArchived)
      .sort((left, right) => compareHistoryTasks(left, right));
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
      needAiCheck: input.needAiCheck,
      rewardPoints: input.rewardPoints
    });
  }

  async updateTask(parent: User, taskId: string, input: UpdateTaskInput) {
    const task = assertFound(await this.repository.findTaskById(taskId), "Task not found");
    this.assertParentFamilyAccess(parent, task);

    if (!isIncompleteTask(task)) {
      throw new AppError(409, "TASK_NOT_EDITABLE", "Only incomplete tasks can be edited");
    }

    return this.repository.updateTask(taskId, input);
  }

  async deleteTask(parent: User, taskId: string) {
    const task = assertFound(await this.repository.findTaskById(taskId), "Task not found");
    this.assertParentFamilyAccess(parent, task);

    if (!isIncompleteTask(task)) {
      throw new AppError(409, "TASK_NOT_DELETABLE", "Only incomplete tasks can be deleted");
    }

    const imageUrls = await this.repository.listTaskImageUrls(taskId);
    await this.repository.deleteTask(taskId);
    await Promise.all(imageUrls.map((imageUrl) => deleteLocalFile(imageUrl)));
  }

  async submitTask(child: User, taskId: string, input: SubmitTaskInput) {
    const task = assertFound(await this.repository.findTaskById(taskId), "Task not found");

    if (child.role !== "child" || task.childUserId !== child.id || task.familyId !== child.familyId) {
      throw new AppError(403, "FORBIDDEN", "Child cannot submit this task");
    }

    if (task.status !== "pending" && task.status !== "needs_resubmit") {
      throw new AppError(409, "TASK_NOT_SUBMITTABLE", "Task cannot be submitted in current status");
    }

    const imageUrls = task.needPhoto ? input.imageUrls : [];
    if (task.needPhoto && imageUrls.length === 0) {
      throw new AppError(400, "VALIDATION_ERROR", "该任务需要至少上传 1 张图片");
    }

    const submission = await this.repository.createSubmission({
      taskId,
      childUserId: child.id,
      status: "submitted",
      childNote: input.childNote
    });
    const images = await this.repository.createImages(submission.id, imageUrls);
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

    if (!["submitted", "ai_checking", "parent_review"].includes(task.status)) {
      throw new AppError(409, "TASK_NOT_REVIEWABLE", "Task cannot be reviewed before child submission");
    }

    const submission = await this.repository.getLatestSubmission(taskId);
    if (!submission) {
      throw new AppError(409, "SUBMISSION_REQUIRED", "Task cannot be reviewed before child submission");
    }

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

    const pointLedger =
      input.reviewResult === "pass" && this.incentiveService
        ? await this.incentiveService.awardTaskReward(parent, task, review.id)
        : null;

    return {
      task: await this.repository.findTaskById(taskId),
      submission,
      review,
      pointLedger
    };
  }

  async getParentDashboard(parent: User) {
    if (parent.role !== "parent") {
      throw new AppError(403, "FORBIDDEN", "Only parents can view dashboard");
    }

    const tasks = this.excludeArchived(
      await Promise.all(
        (await this.repository.listFamilyTasks(parent.familyId)).map((task) => this.withSubmission(task))
      )
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
    const archive = await this.getArchiveMetadata(task);

    return {
      ...task,
      ...archive,
      submission: submission
        ? {
            ...submission,
            images
          }
        : null
    };
  }

  private async getArchiveMetadata(task: StudyTask) {
    const confirmedAt = task.status === "confirmed" ? await this.repository.getTaskConfirmedAt(task.id) : undefined;
    const archivedAtCandidate = confirmedAt ? addDays(confirmedAt, 7) : null;
    const isArchived = Boolean(archivedAtCandidate && Date.parse(archivedAtCandidate) < Date.now());

    return {
      isArchived,
      confirmedAt: confirmedAt ?? null,
      archivedAt: isArchived ? archivedAtCandidate : null
    };
  }

  private excludeArchived<T extends { isArchived: boolean }>(tasks: T[]) {
    return tasks.filter((task) => !task.isArchived);
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

function getMonthRange(month: string) {
  const [year, monthIndex] = month.split("-").map((part) => Number.parseInt(part, 10));
  const startDate = `${month}-01`;
  const endDate = new Date(Date.UTC(year, monthIndex, 0)).toISOString().slice(0, 10);

  return { startDate, endDate };
}

function isIncompleteTask(task: StudyTask) {
  return task.status === "pending" || task.status === "needs_resubmit";
}

function addDays(iso: string, days: number) {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function compareHistoryTasks(
  left: StudyTask & { archivedAt: string | null },
  right: StudyTask & { archivedAt: string | null }
) {
  if (left.archivedAt !== right.archivedAt) {
    return (right.archivedAt ?? "").localeCompare(left.archivedAt ?? "");
  }

  if (left.dueDate !== right.dueDate) {
    return right.dueDate.localeCompare(left.dueDate);
  }

  return right.createdAt.localeCompare(left.createdAt);
}
