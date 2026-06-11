import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import type { DbPool } from "../../server/db.js";
import type { ParentReview, StudyTask, SubmissionImage, TaskSubmission, UserRole } from "../../domain/types.js";

type DbExecutor = Pick<DbPool, "execute"> | Pick<PoolConnection, "execute">;

type TaskRow = RowDataPacket & {
  id: string;
  family_id: string;
  child_user_id: string;
  creator_user_id: string;
  subject: StudyTask["subject"];
  task_type: StudyTask["taskType"];
  title: string;
  description: string;
  note: string | null;
  due_date: string;
  due_time: string | null;
  need_photo: 0 | 1;
  reward_points: number;
  status: StudyTask["status"];
  created_at: string;
  updated_at: string;
};

type SubmissionRow = RowDataPacket & {
  id: string;
  task_id: string;
  child_user_id: string;
  status: TaskSubmission["status"];
  child_note: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
};

type ImageRow = RowDataPacket & {
  id: string;
  submission_id: string;
  image_url: string;
  image_thumb_url: string | null;
  sort_order: number;
  upload_status: "uploaded";
  created_at: string;
};

type FamilyChildRow = RowDataPacket & {
  id: string;
  role: UserRole;
};

type TaskArchiveRow = RowDataPacket & {
  confirmed_at: string | null;
};

type ReviewRow = RowDataPacket & {
  id?: string;
  task_id?: string;
  submission_id?: string;
  parent_user_id?: string;
  review_result: ParentReview["reviewResult"];
  comment: string | null;
  reviewed_at: string;
};

type FamilyChildDetailRow = RowDataPacket & {
  id: string;
  nickname: string;
};

export class TaskRepository {
  constructor(private readonly db: DbPool) {}

  async withTransaction<T>(callback: (connection: PoolConnection) => Promise<T>) {
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findTaskById(taskId: string) {
    const [rows] = await this.db.execute<TaskRow[]>(
      `select *
       from study_task
       where id = :taskId and deleted_at is null
       limit 1`,
      { taskId }
    );

    return rows[0] ? mapTask(rows[0]) : undefined;
  }

  async findTaskByIdForUpdate(connection: PoolConnection, taskId: string) {
    const [rows] = await connection.execute<TaskRow[]>(
      `select *
       from study_task
       where id = :taskId and deleted_at is null
       limit 1
       for update`,
      { taskId }
    );

    return rows[0] ? mapTask(rows[0]) : undefined;
  }

  async findTaskByImageUrl(imageUrl: string) {
    const [rows] = await this.db.execute<TaskRow[]>(
      `select st.*
       from submission_image si
       join task_submission ts on ts.id = si.submission_id
       join study_task st on st.id = ts.task_id
       where si.image_url = :imageUrl
         and st.deleted_at is null
       limit 1`,
      { imageUrl }
    );

    return rows[0] ? mapTask(rows[0]) : undefined;
  }

  async isFamilyChild(familyId: string, childUserId: string) {
    const [rows] = await this.db.execute<FamilyChildRow[]>(
      `select id, role
       from \`user\`
       where id = :childUserId
         and family_id = :familyId
         and role = 'child'
         and deleted_at is null
       limit 1`,
      { familyId, childUserId }
    );

    return rows.length > 0;
  }

  async findOnlyFamilyChild(familyId: string) {
    const [rows] = await this.db.execute<FamilyChildDetailRow[]>(
      `select id, nickname
       from \`user\`
       where family_id = :familyId
         and role = 'child'
         and deleted_at is null
       order by created_at
       limit 2`,
      { familyId }
    );

    return rows.length === 1 ? rows[0] : undefined;
  }

  async listTodayTasks(
    familyId: string,
    childUserId: string,
    dueDate: string,
    options: { includeOverdueIncomplete?: boolean; includeCompleted?: boolean } = {}
  ) {
    const [rows] = await this.db.execute<TaskRow[]>(
      `select *
       from study_task
       where family_id = :familyId
         and child_user_id = :childUserId
         and (
           due_date = :dueDate
           or (
             :includeOverdueIncomplete = true
             and due_date < :dueDate
             and status in ('pending', 'needs_resubmit')
           )
          or (
             :includeCompleted = true
             and status in ('parent_review', 'confirmed')
           )
         )
         and deleted_at is null
       order by due_date = :dueDate desc, due_date desc, due_time is null, due_time, created_at`,
      {
        familyId,
        childUserId,
        dueDate,
        includeOverdueIncomplete: options.includeOverdueIncomplete ?? false,
        includeCompleted: options.includeCompleted ?? false
      }
    );

    return rows.map(mapTask);
  }

  async listFamilyTasks(familyId: string) {
    const [rows] = await this.db.execute<TaskRow[]>(
      `select *
       from study_task
       where family_id = :familyId
         and deleted_at is null
       order by due_date, due_time is null, due_time, created_at`,
      { familyId }
    );

    return rows.map(mapTask);
  }

  async listFamilyTodayTasks(familyId: string, dueDate: string) {
    const [rows] = await this.db.execute<TaskRow[]>(
      `select *
       from study_task
       where family_id = :familyId
         and due_date = :dueDate
         and deleted_at is null
       order by due_time is null, due_time, created_at`,
      { familyId, dueDate }
    );

    return rows.map(mapTask);
  }

  async listFamilyTasksByDateRange(familyId: string, startDate: string, endDate: string) {
    const [rows] = await this.db.execute<TaskRow[]>(
      `select *
       from study_task
       where family_id = :familyId
         and due_date >= :startDate
         and due_date <= :endDate
         and deleted_at is null
       order by due_date, due_time is null, due_time, created_at`,
      { familyId, startDate, endDate }
    );

    return rows.map(mapTask);
  }

  async getTaskConfirmedAt(taskId: string) {
    const [rows] = await this.db.execute<TaskArchiveRow[]>(
      `select max(reviewed_at) as confirmed_at
       from parent_review
       where task_id = :taskId
         and review_result = 'pass'`,
      { taskId }
    );

    return rows[0]?.confirmed_at ? toIsoDateTime(rows[0].confirmed_at) : undefined;
  }

  async getLatestReview(taskId: string) {
    const [rows] = await this.db.execute<ReviewRow[]>(
      `select review_result, comment, reviewed_at
       from parent_review
       where task_id = :taskId
       order by reviewed_at desc
       limit 1`,
      { taskId }
    );
    const row = rows[0];

    return row
      ? {
          reviewResult: row.review_result,
          comment: row.comment ?? undefined,
          reviewedAt: toIsoDateTime(row.reviewed_at)
        }
      : undefined;
  }

  async listChildTasksByDateRange(familyId: string, childUserId: string, startDate: string, endDate: string) {
    const [rows] = await this.db.execute<TaskRow[]>(
      `select *
       from study_task
       where family_id = :familyId
         and child_user_id = :childUserId
         and due_date >= :startDate
         and due_date <= :endDate
         and deleted_at is null
       order by due_date, due_time is null, due_time, created_at`,
      { familyId, childUserId, startDate, endDate }
    );

    return rows.map(mapTask);
  }

  async createTask(input: Omit<StudyTask, "id" | "createdAt" | "updatedAt" | "status">) {
    const now = currentTimestamp();
    const task: StudyTask = {
      id: randomUUID(),
      status: "pending",
      createdAt: now.iso,
      updatedAt: now.iso,
      ...input
    };

    await this.db.execute<ResultSetHeader>(
      `insert into study_task (
         id, family_id, child_user_id, creator_user_id, subject, task_type,
         title, description, note, due_date, due_time, need_photo,
         reward_points, status, created_at, updated_at
       ) values (
         :id, :familyId, :childUserId, :creatorUserId, :subject, :taskType,
         :title, :description, :note, :dueDate, :dueTime, :needPhoto,
         :rewardPoints, :status, :createdAt, :updatedAt
       )`,
      {
        id: task.id,
        familyId: task.familyId,
        childUserId: task.childUserId,
        creatorUserId: task.creatorUserId,
        subject: task.subject,
        taskType: task.taskType,
        title: task.title,
        description: task.description,
        note: task.note ?? null,
        dueDate: task.dueDate,
        dueTime: task.dueTime ?? null,
        needPhoto: task.needPhoto,
        rewardPoints: task.rewardPoints,
        status: task.status,
        createdAt: now.mysql,
        updatedAt: now.mysql
      }
    );

    return task;
  }

  async updateTask(
    taskId: string,
    patch: Partial<
      Pick<
        StudyTask,
        | "subject"
        | "taskType"
        | "title"
        | "description"
        | "note"
        | "dueDate"
        | "dueTime"
        | "needPhoto"
        | "rewardPoints"
      >
    >
  ) {
    const task = await this.findTaskById(taskId);

    if (!task) {
      return undefined;
    }

    const nextTask = {
      ...task,
      ...patch,
      updatedAt: currentTimestamp().iso
    };
    const updatedAt = toMysqlDateTime(nextTask.updatedAt);

    await this.db.execute<ResultSetHeader>(
      `update study_task
       set subject = :subject,
           task_type = :taskType,
           title = :title,
           description = :description,
           note = :note,
           due_date = :dueDate,
           due_time = :dueTime,
           need_photo = :needPhoto,
           reward_points = :rewardPoints,
           updated_at = :updatedAt
       where id = :taskId and deleted_at is null`,
      {
        taskId,
        subject: nextTask.subject,
        taskType: nextTask.taskType,
        title: nextTask.title,
        description: nextTask.description,
        note: nextTask.note ?? null,
        dueDate: nextTask.dueDate,
        dueTime: nextTask.dueTime ?? null,
        needPhoto: nextTask.needPhoto,
        rewardPoints: nextTask.rewardPoints,
        updatedAt
      }
    );

    return nextTask;
  }

  async deleteTask(taskId: string) {
    const [result] = await this.db.execute<ResultSetHeader>(
      `update study_task
       set deleted_at = :deletedAt, updated_at = :deletedAt
       where id = :taskId and deleted_at is null`,
      { taskId, deletedAt: currentTimestamp().mysql }
    );

    return result.affectedRows > 0;
  }

  async listTaskImageUrls(taskId: string) {
    const [rows] = await this.db.execute<(RowDataPacket & { image_url: string })[]>(
      `select si.image_url
       from submission_image si
       join task_submission ts on ts.id = si.submission_id
       where ts.task_id = :taskId`,
      { taskId }
    );

    return rows.map((row) => row.image_url);
  }

  async setTaskStatus(taskId: string, status: StudyTask["status"]) {
    const updatedAt = currentTimestamp();
    await this.db.execute<ResultSetHeader>(
      `update study_task
       set status = :status, updated_at = :updatedAt
       where id = :taskId and deleted_at is null`,
      { taskId, status, updatedAt: updatedAt.mysql }
    );

    return this.findTaskById(taskId);
  }

  async setTaskStatusInTransaction(connection: PoolConnection, taskId: string, status: StudyTask["status"]) {
    const updatedAt = currentTimestamp();
    await connection.execute<ResultSetHeader>(
      `update study_task
       set status = :status, updated_at = :updatedAt
       where id = :taskId and deleted_at is null`,
      { taskId, status, updatedAt: updatedAt.mysql }
    );
  }

  async createSubmission(input: Omit<TaskSubmission, "id" | "submittedAt" | "createdAt" | "updatedAt">) {
    return this.createSubmissionWith(this.db, input);
  }

  async createSubmissionInTransaction(
    connection: PoolConnection,
    input: Omit<TaskSubmission, "id" | "submittedAt" | "createdAt" | "updatedAt">
  ) {
    return this.createSubmissionWith(connection, input);
  }

  private async createSubmissionWith(
    db: DbExecutor,
    input: Omit<TaskSubmission, "id" | "submittedAt" | "createdAt" | "updatedAt">
  ) {
    const now = currentTimestamp();
    const submission: TaskSubmission = {
      id: randomUUID(),
      submittedAt: now.iso,
      createdAt: now.iso,
      updatedAt: now.iso,
      ...input
    };

    await db.execute<ResultSetHeader>(
      `insert into task_submission (
         id, task_id, child_user_id, status, child_note,
         submitted_at, created_at, updated_at
       ) values (
         :id, :taskId, :childUserId, :status, :childNote,
         :submittedAt, :createdAt, :updatedAt
       )`,
      {
        id: submission.id,
        taskId: submission.taskId,
        childUserId: submission.childUserId,
        status: submission.status,
        childNote: submission.childNote ?? null,
        submittedAt: now.mysql,
        createdAt: now.mysql,
        updatedAt: now.mysql
      }
    );

    return submission;
  }

  async listSubmissions(taskId: string) {
    const [rows] = await this.db.execute<SubmissionRow[]>(
      `select *
       from task_submission
       where task_id = :taskId
       order by submitted_at asc, created_at asc`,
      { taskId }
    );

    return rows.map(mapSubmission);
  }

  async getLatestSubmission(taskId: string) {
    const [rows] = await this.db.execute<SubmissionRow[]>(
      `select *
       from task_submission
       where task_id = :taskId
       order by submitted_at desc, created_at desc
       limit 1`,
      { taskId }
    );

    return rows[0] ? mapSubmission(rows[0]) : undefined;
  }

  async getLatestSubmissionForUpdate(connection: PoolConnection, taskId: string) {
    const [rows] = await connection.execute<SubmissionRow[]>(
      `select *
       from task_submission
       where task_id = :taskId
       order by submitted_at desc, created_at desc
       limit 1
       for update`,
      { taskId }
    );

    return rows[0] ? mapSubmission(rows[0]) : undefined;
  }

  async createImages(submissionId: string, imageUrls: string[]) {
    return this.createImagesWith(this.db, submissionId, imageUrls);
  }

  async createImagesInTransaction(connection: PoolConnection, submissionId: string, imageUrls: string[]) {
    return this.createImagesWith(connection, submissionId, imageUrls);
  }

  private async createImagesWith(db: DbExecutor, submissionId: string, imageUrls: string[]) {
    const now = currentTimestamp();
    const images: SubmissionImage[] = imageUrls.map((imageUrl, index) => ({
      id: randomUUID(),
      submissionId,
      imageUrl,
      imageThumbUrl: imageUrl,
      sortOrder: index,
      uploadStatus: "uploaded",
      createdAt: now.iso
    }));

    if (images.length === 0) {
      return images;
    }

    await Promise.all(
      images.map((image) =>
        db.execute<ResultSetHeader>(
          `insert into submission_image (
             id, submission_id, image_url, image_thumb_url,
             sort_order, upload_status, created_at
           ) values (
             :id, :submissionId, :imageUrl, :imageThumbUrl,
             :sortOrder, :uploadStatus, :createdAt
           )`,
          {
            id: image.id,
            submissionId: image.submissionId,
            imageUrl: image.imageUrl,
            imageThumbUrl: image.imageThumbUrl ?? null,
            sortOrder: image.sortOrder,
            uploadStatus: image.uploadStatus,
            createdAt: now.mysql
          }
        )
      )
    );

    return images;
  }

  async listImages(submissionId: string) {
    const [rows] = await this.db.execute<ImageRow[]>(
      `select *
       from submission_image
       where submission_id = :submissionId
       order by sort_order asc, created_at asc`,
      { submissionId }
    );

    return rows.map(mapImage);
  }

  async updateSubmissionStatus(submissionId: string, status: TaskSubmission["status"]) {
    const updatedAt = currentTimestamp();
    await this.db.execute<ResultSetHeader>(
      `update task_submission
       set status = :status, updated_at = :updatedAt
       where id = :submissionId`,
      { submissionId, status, updatedAt: updatedAt.mysql }
    );
  }

  async updateSubmissionStatusInTransaction(
    connection: PoolConnection,
    submissionId: string,
    status: TaskSubmission["status"]
  ) {
    const updatedAt = currentTimestamp();
    await connection.execute<ResultSetHeader>(
      `update task_submission
       set status = :status, updated_at = :updatedAt
       where id = :submissionId`,
      { submissionId, status, updatedAt: updatedAt.mysql }
    );
  }

  async createReview(input: Omit<ParentReview, "id" | "reviewedAt">) {
    return this.createReviewWith(this.db, input);
  }

  async createReviewInTransaction(
    connection: PoolConnection,
    input: Omit<ParentReview, "id" | "reviewedAt">
  ) {
    return this.createReviewWith(connection, input);
  }

  private async createReviewWith(db: DbExecutor, input: Omit<ParentReview, "id" | "reviewedAt">) {
    const now = currentTimestamp();
    const review: ParentReview = {
      id: randomUUID(),
      reviewedAt: now.iso,
      ...input
    };

    await db.execute<ResultSetHeader>(
      `insert into parent_review (
         id, task_id, submission_id, parent_user_id,
         review_result, comment, reviewed_at
       ) values (
         :id, :taskId, :submissionId, :parentUserId,
         :reviewResult, :comment, :reviewedAt
       )`,
      {
        id: review.id,
        taskId: review.taskId,
        submissionId: review.submissionId,
        parentUserId: review.parentUserId,
        reviewResult: review.reviewResult,
        comment: review.comment ?? null,
        reviewedAt: now.mysql
      }
    );

    return review;
  }

  async getReviewBySubmission(submissionId: string) {
    return this.getReviewBySubmissionWith(this.db, submissionId);
  }

  async getReviewBySubmissionInTransaction(connection: PoolConnection, submissionId: string) {
    return this.getReviewBySubmissionWith(connection, submissionId);
  }

  private async getReviewBySubmissionWith(db: DbExecutor, submissionId: string) {
    const [rows] = await db.execute<ReviewRow[]>(
      `select id, task_id, submission_id, parent_user_id, review_result, comment, reviewed_at
       from parent_review
       where submission_id = :submissionId
       limit 1`,
      { submissionId }
    );
    const row = rows[0];

    return row && row.id && row.task_id && row.submission_id && row.parent_user_id
      ? {
          id: row.id,
          taskId: row.task_id,
          submissionId: row.submission_id,
          parentUserId: row.parent_user_id,
          reviewResult: row.review_result,
          comment: row.comment ?? undefined,
          reviewedAt: toIsoDateTime(row.reviewed_at)
        }
      : undefined;
  }
}

function mapTask(row: TaskRow): StudyTask {
  return {
    id: row.id,
    familyId: row.family_id,
    childUserId: row.child_user_id,
    creatorUserId: row.creator_user_id,
    subject: row.subject,
    taskType: row.task_type,
    title: row.title,
    description: row.description,
    note: row.note ?? undefined,
    dueDate: row.due_date,
    dueTime: row.due_time ?? undefined,
    needPhoto: Boolean(row.need_photo),
    rewardPoints: row.reward_points,
    status: row.status,
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at)
  };
}

function mapSubmission(row: SubmissionRow): TaskSubmission {
  return {
    id: row.id,
    taskId: row.task_id,
    childUserId: row.child_user_id,
    status: row.status,
    childNote: row.child_note ?? undefined,
    submittedAt: toIsoDateTime(row.submitted_at),
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at)
  };
}

function mapImage(row: ImageRow): SubmissionImage {
  return {
    id: row.id,
    submissionId: row.submission_id,
    imageUrl: row.image_url,
    imageThumbUrl: row.image_thumb_url ?? undefined,
    sortOrder: row.sort_order,
    uploadStatus: row.upload_status,
    createdAt: toIsoDateTime(row.created_at)
  };
}

function currentTimestamp() {
  const iso = new Date().toISOString();
  return {
    iso,
    mysql: toMysqlDateTime(iso)
  };
}

function toMysqlDateTime(iso: string) {
  return iso.slice(0, 23).replace("T", " ");
}

function toIsoDateTime(value: string) {
  return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}
