import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../../shared/errors.js";
import type { LatestReview, StudyTask, User } from "../../domain/types.js";
import type { TaskRepository } from "./task.repository.js";
import { TaskService } from "./task.service.js";

const parent: User = {
  id: "parent-1",
  familyId: "family-1",
  role: "parent",
  username: "parent_demo",
  passwordHash: "hash",
  nickname: "家长 Demo"
};

const child: User = {
  id: "child-1",
  familyId: "family-1",
  role: "child",
  username: "child_demo",
  passwordHash: "hash",
  nickname: "孩子 Demo"
};

const baseTask: StudyTask = {
  id: "task-1",
  familyId: "family-1",
  childUserId: "child-1",
  creatorUserId: "parent-1",
  subject: "数学",
  taskType: "练习",
  title: "完成计算练习",
  description: "完成第 3 页",
  dueDate: "2026-05-01",
  dueTime: "20:30",
  needPhoto: true,
  needAiCheck: false,
  rewardPoints: 10,
  status: "confirmed",
  createdAt: "2026-05-01T10:00:00.000Z",
  updatedAt: "2026-05-01T10:00:00.000Z"
};

const oldConfirmedTask = {
  task: baseTask,
  confirmedAt: "2000-01-01T00:00:00.000Z"
};

const recentConfirmedTask = {
  task: {
    ...baseTask,
    id: "task-2",
    title: "最近确认任务"
  },
  confirmedAt: "2100-01-01T00:00:00.000Z"
};

describe("TaskService history archive", () => {
  it("hides archived tasks from parent dashboard", async () => {
    const service = new TaskService(
      mockRepository({
        tasks: [oldConfirmedTask, recentConfirmedTask]
      }) as unknown as TaskRepository
    );

    const dashboard = await service.getParentDashboard(parent);

    assert.equal(dashboard.summary.total, 1);
    assert.equal(dashboard.tasks[0]?.id, "task-2");
    assert.equal(dashboard.tasks[0]?.isArchived, false);
  });

  it("returns only archived tasks from history with archive metadata", async () => {
    const service = new TaskService(
      mockRepository({
        tasks: [oldConfirmedTask, recentConfirmedTask]
      }) as unknown as TaskRepository
    );

    const tasks = await service.listHistoryTasks(parent, {});

    assert.equal(tasks.length, 1);
    assert.equal(tasks[0]?.id, "task-1");
    assert.equal(tasks[0]?.isArchived, true);
    assert.equal(tasks[0]?.confirmedAt, "2000-01-01T00:00:00.000Z");
    assert.equal(tasks[0]?.archivedAt, "2000-01-08T00:00:00.000Z");
  });

  it("keeps archived tasks in calendar responses and marks them", async () => {
    const service = new TaskService(
      mockRepository({
        tasks: [oldConfirmedTask]
      }) as unknown as TaskRepository
    );

    const tasks = await service.listCalendarTasks(parent, { month: "2026-05" });

    assert.equal(tasks.length, 1);
    assert.equal(tasks[0]?.id, "task-1");
    assert.equal(tasks[0]?.isArchived, true);
  });

  it("blocks children from reading another child's history", async () => {
    const service = new TaskService(mockRepository({ tasks: [] }) as unknown as TaskRepository);

    await assert.rejects(
      () => service.listHistoryTasks(child, { childUserId: "child-2" }),
      (error) => {
        assert.equal(error instanceof AppError, true);
        assert.equal((error as AppError).code, "FORBIDDEN");
        return true;
      }
    );
  });

  it("validates parent child filters against the current family", async () => {
    const service = new TaskService(
      mockRepository({
        tasks: [],
        familyChildIds: new Set(["child-1"])
      }) as unknown as TaskRepository
    );

    await assert.rejects(
      () => service.listHistoryTasks(parent, { childUserId: "child-2" }),
      (error) => {
        assert.equal(error instanceof AppError, true);
        assert.equal((error as AppError).code, "FORBIDDEN");
        return true;
      }
    );
  });
});

describe("TaskService dashboard and review details", () => {
  it("counts all submitted states and sorts action items first", async () => {
    const makeTask = (id: string, status: StudyTask["status"], dueDate: string): MockTaskRecord => ({
      task: { ...baseTask, id, status, dueDate, title: id }
    });
    const service = new TaskService(
      mockRepository({
        tasks: [
          makeTask("future", "pending", "2100-01-01"),
          makeTask("today", "pending", "2000-01-01"),
          makeTask("resubmit", "needs_resubmit", "2100-01-02"),
          makeTask("checking", "ai_checking", "2100-01-03"),
          makeTask("submitted", "submitted", "2100-01-04"),
          makeTask("review", "parent_review", "2100-01-05")
        ]
      }) as unknown as TaskRepository
    );

    const dashboard = await service.getParentDashboard(parent);

    assert.equal(dashboard.summary.waitingReview, 3);
    assert.deepEqual(
      dashboard.tasks.map((task) => task.id),
      ["checking", "submitted", "review", "resubmit", "today", "future"]
    );
  });

  it("returns the latest parent review with task details", async () => {
    const latestReview: LatestReview = {
      reviewResult: "need_resubmit",
      comment: "请补拍完整页面",
      reviewedAt: "2026-06-08T10:00:00.000Z"
    };
    const service = new TaskService(
      mockRepository({
        tasks: [{ task: { ...baseTask, status: "needs_resubmit" }, latestReview }]
      }) as unknown as TaskRepository
    );

    const task = await service.getTask(child, baseTask.id);

    assert.deepEqual(task.latestReview, latestReview);
  });
});

type MockTaskRecord = {
  task: StudyTask;
  confirmedAt?: string;
  latestReview?: LatestReview;
};

function mockRepository({
  tasks = [],
  familyChildIds = new Set(["child-1", "child-2"])
}: {
  tasks?: MockTaskRecord[];
  familyChildIds?: Set<string>;
}) {
  const byId = new Map(tasks.map((record) => [record.task.id, record]));

  return {
    listFamilyTasks: async (familyId: string) =>
      tasks.filter((record) => record.task.familyId === familyId).map((record) => record.task),
    listTodayTasks: async (familyId: string, childUserId: string) =>
      tasks
        .filter((record) => record.task.familyId === familyId && record.task.childUserId === childUserId)
        .map((record) => record.task),
    listFamilyTodayTasks: async (familyId: string) =>
      tasks.filter((record) => record.task.familyId === familyId).map((record) => record.task),
    listFamilyTasksByDateRange: async (familyId: string, startDate: string, endDate: string) =>
      tasks
        .filter(
          (record) =>
            record.task.familyId === familyId && record.task.dueDate >= startDate && record.task.dueDate <= endDate
        )
        .map((record) => record.task),
    listChildTasksByDateRange: async (familyId: string, childUserId: string, startDate: string, endDate: string) =>
      tasks
        .filter(
          (record) =>
            record.task.familyId === familyId &&
            record.task.childUserId === childUserId &&
            record.task.dueDate >= startDate &&
            record.task.dueDate <= endDate
        )
        .map((record) => record.task),
    isFamilyChild: async (familyId: string, childUserId: string) => familyId === "family-1" && familyChildIds.has(childUserId),
    getTaskConfirmedAt: async (taskId: string) => byId.get(taskId)?.confirmedAt,
    getLatestReview: async (taskId: string) => byId.get(taskId)?.latestReview,
    findTaskById: async (taskId: string) => byId.get(taskId)?.task,
    getLatestSubmission: async () => undefined,
    listImages: async () => []
  };
}
