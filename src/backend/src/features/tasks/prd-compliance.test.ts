import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ParentReview, StudyTask, TaskSubmission, User } from "../../domain/types.js";
import { AppError } from "../../shared/errors.js";
import { rejectRedeemSchema, rejectWishSchema } from "../incentives/incentive.schemas.js";
import type { IncentiveService } from "../incentives/incentive.service.js";
import { TaskRepository } from "./task.repository.js";
import { createTaskSchema, reviewTaskSchema } from "./task.schemas.js";
import { TaskService } from "./task.service.js";

const parent: User = {
  id: "parent-1",
  familyId: "family-1",
  role: "parent",
  username: "parent",
  passwordHash: "hash",
  nickname: "家长"
};

const task: StudyTask = {
  id: "task-1",
  familyId: "family-1",
  childUserId: "child-1",
  creatorUserId: parent.id,
  subject: "数学",
  taskType: "练习",
  title: "口算",
  description: "完成一页口算",
  dueDate: "2026-06-11",
  needPhoto: true,
  rewardPoints: 1,
  status: "pending",
  createdAt: "2026-06-11T00:00:00.000Z",
  updatedAt: "2026-06-11T00:00:00.000Z"
};

describe("PRD validation rules", () => {
  it("defaults task rewards to one and rejects removed AI options", () => {
    const input = {
      subject: "数学",
      taskType: "练习",
      title: "口算",
      description: "完成一页口算",
      dueDate: "2026-06-11"
    };

    assert.equal(createTaskSchema.parse(input).rewardPoints, 1);
    assert.equal(createTaskSchema.safeParse({ ...input, needAiCheck: true }).success, false);
  });

  it("requires reasons for resubmission, wish rejection and redemption rejection", () => {
    assert.equal(
      reviewTaskSchema.safeParse({ reviewResult: "need_resubmit", comment: " " }).success,
      false
    );
    assert.equal(rejectWishSchema.safeParse({ rejectReason: " " }).success, false);
    assert.equal(rejectRedeemSchema.safeParse({ rejectReason: "" }).success, false);
  });
});

describe("PRD task consistency", () => {
  it("rolls back repository transactions when a write fails", async () => {
    let committed = false;
    let rolledBack = false;
    let released = false;
    const connection = {
      beginTransaction: async () => undefined,
      commit: async () => {
        committed = true;
      },
      rollback: async () => {
        rolledBack = true;
      },
      release: () => {
        released = true;
      }
    };
    const repository = new TaskRepository({
      getConnection: async () => connection
    } as never);

    await assert.rejects(
      () =>
        repository.withTransaction(async () => {
          throw new Error("write failed");
        }),
      /write failed/
    );
    assert.equal(committed, false);
    assert.equal(rolledBack, true);
    assert.equal(released, true);
  });

  it("returns all submissions with their own images and reviews", async () => {
    const first = makeSubmission("submission-1", "needs_resubmit");
    const second = makeSubmission("submission-2", "submitted");
    const firstReview: ParentReview = {
      id: "review-1",
      taskId: task.id,
      submissionId: first.id,
      parentUserId: parent.id,
      reviewResult: "need_resubmit",
      comment: "请补拍",
      reviewedAt: "2026-06-11T02:00:00.000Z"
    };
    const repository = {
      findTaskById: async () => ({ ...task, status: "parent_review" }),
      listSubmissions: async () => [first, second],
      listImages: async (submissionId: string) => [
        {
          id: `image-${submissionId}`,
          submissionId,
          imageUrl: `/uploads/photos/${submissionId}.jpg`,
          sortOrder: 0,
          uploadStatus: "uploaded" as const,
          createdAt: "2026-06-11T01:00:00.000Z"
        }
      ],
      getReviewBySubmission: async (submissionId: string) =>
        submissionId === first.id ? firstReview : undefined,
      getLatestReview: async () => firstReview,
      getTaskConfirmedAt: async () => undefined
    };

    const result = await new TaskService(repository as never).getTask(parent, task.id);

    assert.equal(result.submissions.length, 2);
    assert.equal(result.submissions[0]?.review?.comment, "请补拍");
    assert.equal(result.submissions[1]?.images.length, 1);
    assert.equal(result.submission?.id, second.id);
  });

  it("does not create a second review or point ledger for the same submission", async () => {
    const submission = makeSubmission("submission-1", "parent_confirmed");
    const review: ParentReview = {
      id: "review-1",
      taskId: task.id,
      submissionId: submission.id,
      parentUserId: parent.id,
      reviewResult: "pass",
      reviewedAt: "2026-06-11T02:00:00.000Z"
    };
    let createReviewCalls = 0;
    const repository = {
      withTransaction: async (callback: (connection: object) => Promise<unknown>) => callback({}),
      findTaskByIdForUpdate: async () => ({ ...task, status: "confirmed" }),
      getLatestSubmissionForUpdate: async () => submission,
      getReviewBySubmissionInTransaction: async () => review,
      createReviewInTransaction: async () => {
        createReviewCalls += 1;
      },
      findTaskById: async () => ({ ...task, status: "confirmed" }),
      listSubmissions: async () => [submission],
      listImages: async () => [],
      getReviewBySubmission: async () => review,
      getLatestReview: async () => review,
      getTaskConfirmedAt: async () => review.reviewedAt
    };
    const incentiveService = {
      getTaskRewardLedger: async () => ({
        id: "ledger-1"
      })
    };

    const result = await new TaskService(
      repository as never,
      incentiveService as unknown as IncentiveService
    ).reviewTask(parent, task.id, { reviewResult: "pass" });

    assert.equal(result.idempotent, true);
    assert.equal(createReviewCalls, 0);
    assert.equal(result.pointLedger?.id, "ledger-1");
  });

  it("only allows deletion of pending tasks without submissions", async () => {
    const service = new TaskService({
      findTaskById: async () => ({ ...task, status: "needs_resubmit" })
    } as never);

    await assert.rejects(
      () => service.deleteTask(parent, task.id),
      (error) => error instanceof AppError && error.code === "TASK_NOT_DELETABLE"
    );
  });
});

function makeSubmission(id: string, status: TaskSubmission["status"]): TaskSubmission {
  return {
    id,
    taskId: task.id,
    childUserId: task.childUserId,
    status,
    submittedAt: "2026-06-11T01:00:00.000Z",
    createdAt: "2026-06-11T01:00:00.000Z",
    updatedAt: "2026-06-11T01:00:00.000Z"
  };
}
