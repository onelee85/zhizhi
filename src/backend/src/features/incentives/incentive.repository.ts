import { randomUUID } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  ChildPointAccount,
  PointLedger,
  StudyTask,
  Wish,
  WishRedeemRequest
} from "../../domain/types.js";
import type { DbPool } from "../../server/db.js";
import { AppError } from "../../shared/errors.js";

type DbExecutor = Pick<DbPool, "execute"> | Pick<PoolConnection, "execute">;

type AccountRow = RowDataPacket & {
  id: string;
  family_id: string;
  child_user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
};

type LedgerRow = RowDataPacket & {
  id: string;
  family_id: string;
  child_user_id: string;
  change_amount: number;
  balance_after: number;
  reason: PointLedger["reason"];
  source_type: PointLedger["sourceType"];
  source_id: string;
  operator_user_id: string;
  created_at: string;
};

type WishRow = RowDataPacket & {
  id: string;
  family_id: string;
  child_user_id: string;
  title: string;
  description: string | null;
  required_points: number | null;
  status: Wish["status"];
  parent_user_id: string | null;
  reject_reason: string | null;
  current_redeem_request_id: string | null;
  created_at: string;
  updated_at: string;
  redeemed_at: string | null;
};

type WishRedeemRequestRow = RowDataPacket & {
  id: string;
  wish_id: string;
  family_id: string;
  child_user_id: string;
  required_points: number;
  status: WishRedeemRequest["status"];
  reject_reason: string | null;
  parent_user_id: string | null;
  requested_at: string;
  resolved_at: string | null;
};

export class IncentiveRepository {
  constructor(private readonly db: DbPool) {}

  async isFamilyChild(familyId: string, childUserId: string) {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      `select id
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

  async getOrCreateAccount(familyId: string, childUserId: string) {
    await this.ensureAccount(this.db, familyId, childUserId);
    const account = await this.findAccount(familyId, childUserId);

    if (!account) {
      throw new Error("Point account was not initialized");
    }

    return account;
  }

  async listLedger(familyId: string, childUserId: string) {
    const [rows] = await this.db.execute<LedgerRow[]>(
      `select *
       from point_ledger
       where family_id = :familyId and child_user_id = :childUserId
       order by created_at desc`,
      { familyId, childUserId }
    );

    return rows.map(mapLedger);
  }

  async awardTaskReward(task: StudyTask, operatorUserId: string) {
    if (task.rewardPoints <= 0) {
      return null;
    }

    return this.withTransaction((connection) => this.awardTaskRewardInTransaction(connection, task, operatorUserId));
  }

  async awardTaskRewardInTransaction(
    connection: PoolConnection,
    task: StudyTask,
    operatorUserId: string
  ) {
    if (task.rewardPoints <= 0) {
      return null;
    }

    await this.ensureAccount(connection, task.familyId, task.childUserId);
    const existingLedger = await this.findLedgerBySource(connection, task.familyId, "task_review", task.id);

    if (existingLedger) {
      return existingLedger;
    }

    const account = await this.findAccountForUpdate(connection, task.familyId, task.childUserId);
    const nextBalance = account.balance + task.rewardPoints;
    const now = currentTimestamp();
    const ledger: PointLedger = {
      id: randomUUID(),
      familyId: task.familyId,
      childUserId: task.childUserId,
      changeAmount: task.rewardPoints,
      balanceAfter: nextBalance,
      reason: "task_reward",
      sourceType: "task_review",
      sourceId: task.id,
      operatorUserId,
      createdAt: now.iso
    };

    await connection.execute<ResultSetHeader>(
      `update child_point_account
       set balance = :balance,
           total_earned = total_earned + :changeAmount,
           updated_at = :updatedAt
       where id = :accountId`,
      {
        accountId: account.id,
        balance: nextBalance,
        changeAmount: task.rewardPoints,
        updatedAt: now.mysql
      }
    );
    await this.insertLedger(connection, ledger, now.mysql);

    return ledger;
  }

  async findTaskRewardLedger(familyId: string, taskId: string) {
    return this.findLedgerBySource(this.db, familyId, "task_review", taskId);
  }

  async listWishes(familyId: string, childUserId?: string) {
    const [rows] = await this.db.execute<WishRow[]>(
      `select *
       from wish
       where family_id = :familyId
         and (:childUserId is null or child_user_id = :childUserId)
       order by created_at desc`,
      { familyId, childUserId: childUserId ?? null }
    );

    return rows.map(mapWish);
  }

  async findWishById(wishId: string) {
    const [rows] = await this.db.execute<WishRow[]>(
      `select *
       from wish
       where id = :wishId
       limit 1`,
      { wishId }
    );

    return rows[0] ? mapWish(rows[0]) : undefined;
  }

  async findLatestRedeemRequest(wishId: string) {
    const [rows] = await this.db.execute<WishRedeemRequestRow[]>(
      `select *
       from wish_redeem_request
       where wish_id = :wishId
       order by requested_at desc
       limit 1`,
      { wishId }
    );

    return rows[0] ? mapRedeemRequest(rows[0]) : undefined;
  }

  async createWish(input: Pick<Wish, "familyId" | "childUserId" | "title" | "description">) {
    const now = currentTimestamp();
    const wish: Wish = {
      id: randomUUID(),
      status: "pending_review",
      createdAt: now.iso,
      updatedAt: now.iso,
      ...input
    };

    await this.db.execute<ResultSetHeader>(
      `insert into wish (
         id, family_id, child_user_id, title, description,
         status, created_at, updated_at
       ) values (
         :id, :familyId, :childUserId, :title, :description,
         :status, :createdAt, :updatedAt
       )`,
      {
        id: wish.id,
        familyId: wish.familyId,
        childUserId: wish.childUserId,
        title: wish.title,
        description: wish.description ?? null,
        status: wish.status,
        createdAt: now.mysql,
        updatedAt: now.mysql
      }
    );

    return wish;
  }

  async approveWish(wishId: string, requiredPoints: number, parentUserId: string) {
    const now = currentTimestamp();
    await this.db.execute<ResultSetHeader>(
      `update wish
       set required_points = :requiredPoints,
           status = 'approved',
           parent_user_id = :parentUserId,
           reject_reason = null,
           updated_at = :updatedAt
       where id = :wishId and status = 'pending_review'`,
      { wishId, requiredPoints, parentUserId, updatedAt: now.mysql }
    );

    return this.findWishById(wishId);
  }

  async rejectWish(wishId: string, rejectReason: string | undefined, parentUserId: string) {
    const now = currentTimestamp();
    await this.db.execute<ResultSetHeader>(
      `update wish
       set status = 'rejected',
           parent_user_id = :parentUserId,
           reject_reason = :rejectReason,
           updated_at = :updatedAt
       where id = :wishId and status = 'pending_review'`,
      { wishId, parentUserId, rejectReason: rejectReason ?? null, updatedAt: now.mysql }
    );

    return this.findWishById(wishId);
  }

  async updateWish(
    wishId: string,
    input: Pick<Wish, "title" | "description">
  ) {
    const now = currentTimestamp();
    await this.db.execute<ResultSetHeader>(
      `update wish
       set title = :title,
           description = :description,
           status = 'pending_review',
           required_points = null,
           parent_user_id = null,
           reject_reason = null,
           updated_at = :updatedAt
       where id = :wishId and status = 'rejected'`,
      {
        wishId,
        title: input.title,
        description: input.description ?? null,
        updatedAt: now.mysql
      }
    );

    return this.findWishById(wishId);
  }

  async deleteWish(wishId: string, requiredStatus: Wish["status"]) {
    await this.db.execute<ResultSetHeader>(
      `delete from wish
       where id = :wishId and status = :requiredStatus`,
      { wishId, requiredStatus }
    );

    return { wishId, deleted: true };
  }

  async requestRedeem(wish: Wish, childUserId: string) {
    return this.withTransaction(async (connection) => {
      const lockedWish = await this.findWishForUpdate(connection, wish.id);

      if (!lockedWish) {
        throw new AppError(404, "NOT_FOUND", "Wish not found");
      }
      if (lockedWish.childUserId !== childUserId) {
        throw new AppError(403, "FORBIDDEN", "Wish is outside current child");
      }
      if (lockedWish.status !== "approved" || lockedWish.requiredPoints === undefined) {
        throw new AppError(409, "WISH_NOT_REDEEMABLE", "Wish cannot be redeemed in current status");
      }

      await this.ensureAccount(connection, lockedWish.familyId, lockedWish.childUserId);
      const account = await this.findAccountForUpdate(connection, lockedWish.familyId, lockedWish.childUserId);
      if (account.balance < lockedWish.requiredPoints) {
        throw new AppError(409, "INSUFFICIENT_POINTS", "Current points are not enough for this wish");
      }

      const requestId = randomUUID();
      const nextBalance = account.balance - lockedWish.requiredPoints;
      const now = currentTimestamp();
      const ledger: PointLedger = {
        id: randomUUID(),
        familyId: lockedWish.familyId,
        childUserId: lockedWish.childUserId,
        changeAmount: -lockedWish.requiredPoints,
        balanceAfter: nextBalance,
        reason: "wish_redeem",
        sourceType: "wish",
        sourceId: requestId,
        operatorUserId: childUserId,
        createdAt: now.iso
      };

      await connection.execute<ResultSetHeader>(
        `update child_point_account
         set balance = :balance,
             total_spent = total_spent + :spent,
             updated_at = :updatedAt
         where id = :accountId`,
        {
          accountId: account.id,
          balance: nextBalance,
          spent: lockedWish.requiredPoints,
          updatedAt: now.mysql
        }
      );
      await this.insertLedger(connection, ledger, now.mysql);
      await connection.execute<ResultSetHeader>(
        `insert into wish_redeem_request (
           id, wish_id, family_id, child_user_id, required_points,
           status, requested_at
         ) values (
           :id, :wishId, :familyId, :childUserId, :requiredPoints,
           'pending', :requestedAt
         )`,
        {
          id: requestId,
          wishId: lockedWish.id,
          familyId: lockedWish.familyId,
          childUserId: lockedWish.childUserId,
          requiredPoints: lockedWish.requiredPoints,
          requestedAt: now.mysql
        }
      );
      await connection.execute<ResultSetHeader>(
        `update wish
         set status = 'redeem_requested',
             current_redeem_request_id = :requestId,
             updated_at = :updatedAt
         where id = :wishId and status = 'approved'`,
        { wishId: lockedWish.id, requestId, updatedAt: now.mysql }
      );

      return {
        wish: await this.findWishForUpdate(connection, lockedWish.id),
        ledger
      };
    });
  }

  async confirmRedeem(wish: Wish, parentUserId: string) {
    return this.withTransaction(async (connection) => {
      const lockedWish = await this.findWishForUpdate(connection, wish.id);

      if (
        !lockedWish ||
        lockedWish.status !== "redeem_requested" ||
        lockedWish.requiredPoints === undefined ||
        !lockedWish.currentRedeemRequestId
      ) {
        throw new AppError(409, "WISH_NOT_CONFIRMABLE", "Wish redemption cannot be confirmed in current status");
      }

      const redeemLedger = await this.findLedgerBySourceAndReason(
        connection,
        lockedWish.familyId,
        "wish",
        lockedWish.currentRedeemRequestId,
        "wish_redeem"
      );
      if (!redeemLedger) {
        throw new AppError(409, "WISH_REDEEM_LEDGER_MISSING", "Wish redemption debit was not found");
      }

      const now = currentTimestamp();
      await this.markWishRedeemed(connection, lockedWish.id, parentUserId, now.mysql);
      await this.resolveRedeemRequest(
        connection,
        lockedWish.currentRedeemRequestId,
        "confirmed",
        parentUserId,
        undefined,
        now.mysql
      );

      return assertWish(await this.findWishForUpdate(connection, lockedWish.id));
    });
  }

  async rejectRedeem(wish: Wish, parentUserId: string, rejectReason: string) {
    return this.withTransaction(async (connection) => {
      const lockedWish = await this.findWishForUpdate(connection, wish.id);

      if (
        !lockedWish ||
        lockedWish.status !== "redeem_requested" ||
        lockedWish.requiredPoints === undefined
      ) {
        throw new AppError(409, "WISH_REDEEM_NOT_REJECTABLE", "Wish redemption cannot be rejected in current status");
      }

      const now = currentTimestamp();
      if (!lockedWish.currentRedeemRequestId) {
        await this.markWishRedeemRejected(connection, lockedWish.id, parentUserId, now.mysql);
        return {
          wish: assertWish(await this.findWishForUpdate(connection, lockedWish.id)),
          ledger: null
        };
      }

      await this.ensureAccount(connection, lockedWish.familyId, lockedWish.childUserId);
      const existingRefund = await this.findLedgerBySourceAndReason(
        connection,
        lockedWish.familyId,
        "wish",
        lockedWish.currentRedeemRequestId,
        "wish_refund"
      );

      if (existingRefund) {
        await this.resolveRedeemRequest(
          connection,
          lockedWish.currentRedeemRequestId,
          "rejected",
          parentUserId,
          rejectReason,
          now.mysql
        );
        await this.markWishRedeemRejected(connection, lockedWish.id, parentUserId, now.mysql);
        return {
          wish: assertWish(await this.findWishForUpdate(connection, lockedWish.id)),
          ledger: existingRefund
        };
      }

      const redeemLedger = await this.findLedgerBySourceAndReason(
        connection,
        lockedWish.familyId,
        "wish",
        lockedWish.currentRedeemRequestId,
        "wish_redeem"
      );
      if (!redeemLedger) {
        throw new AppError(409, "WISH_REDEEM_LEDGER_MISSING", "Wish redemption debit was not found");
      }

      const account = await this.findAccountForUpdate(connection, lockedWish.familyId, lockedWish.childUserId);
      const refundAmount = Math.abs(redeemLedger.changeAmount);
      if (account.totalSpent < refundAmount) {
        throw new AppError(409, "POINT_ACCOUNT_INCONSISTENT", "Point account spent total is inconsistent");
      }
      const nextBalance = account.balance + refundAmount;
      const ledger: PointLedger = {
        id: randomUUID(),
        familyId: lockedWish.familyId,
        childUserId: lockedWish.childUserId,
        changeAmount: refundAmount,
        balanceAfter: nextBalance,
        reason: "wish_refund",
        sourceType: "wish",
        sourceId: lockedWish.currentRedeemRequestId,
        operatorUserId: parentUserId,
        createdAt: now.iso
      };

      await connection.execute<ResultSetHeader>(
        `update child_point_account
         set balance = :balance,
             total_spent = total_spent - :refundAmount,
             updated_at = :updatedAt
         where id = :accountId`,
        {
          accountId: account.id,
          balance: nextBalance,
          refundAmount,
          updatedAt: now.mysql
        }
      );
      await this.insertLedger(connection, ledger, now.mysql);
      await this.resolveRedeemRequest(
        connection,
        lockedWish.currentRedeemRequestId,
        "rejected",
        parentUserId,
        rejectReason,
        now.mysql
      );
      await this.markWishRedeemRejected(connection, lockedWish.id, parentUserId, now.mysql);

      return {
        wish: assertWish(await this.findWishForUpdate(connection, lockedWish.id)),
        ledger
      };
    });
  }

  private async withTransaction<T>(callback: (connection: PoolConnection) => Promise<T>) {
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

  private async ensureAccount(db: DbExecutor, familyId: string, childUserId: string) {
    const now = currentTimestamp();
    await db.execute<ResultSetHeader>(
      `insert ignore into child_point_account (
         id, family_id, child_user_id, balance, total_earned, total_spent, created_at, updated_at
       ) values (
         :id, :familyId, :childUserId, 0, 0, 0, :createdAt, :updatedAt
       )`,
      {
        id: randomUUID(),
        familyId,
        childUserId,
        createdAt: now.mysql,
        updatedAt: now.mysql
      }
    );
  }

  private async findAccount(familyId: string, childUserId: string) {
    const [rows] = await this.db.execute<AccountRow[]>(
      `select *
       from child_point_account
       where family_id = :familyId and child_user_id = :childUserId
       limit 1`,
      { familyId, childUserId }
    );

    return rows[0] ? mapAccount(rows[0]) : undefined;
  }

  private async findAccountForUpdate(db: PoolConnection, familyId: string, childUserId: string) {
    const [rows] = await db.execute<AccountRow[]>(
      `select *
       from child_point_account
       where family_id = :familyId and child_user_id = :childUserId
       limit 1
       for update`,
      { familyId, childUserId }
    );

    if (!rows[0]) {
      throw new Error("Point account was not initialized");
    }

    return mapAccount(rows[0]);
  }

  private async findLedgerBySource(
    db: DbExecutor,
    familyId: string,
    sourceType: PointLedger["sourceType"],
    sourceId: string
  ) {
    const [rows] = await db.execute<LedgerRow[]>(
      `select *
       from point_ledger
       where family_id = :familyId
         and source_type = :sourceType
         and source_id = :sourceId
       limit 1`,
      { familyId, sourceType, sourceId }
    );

    return rows[0] ? mapLedger(rows[0]) : undefined;
  }

  private async findLedgerBySourceAndReason(
    db: DbExecutor,
    familyId: string,
    sourceType: PointLedger["sourceType"],
    sourceId: string,
    reason: PointLedger["reason"]
  ) {
    const [rows] = await db.execute<LedgerRow[]>(
      `select *
       from point_ledger
       where family_id = :familyId
         and source_type = :sourceType
         and source_id = :sourceId
         and reason = :reason
       limit 1`,
      { familyId, sourceType, sourceId, reason }
    );

    return rows[0] ? mapLedger(rows[0]) : undefined;
  }

  private async insertLedger(db: DbExecutor, ledger: PointLedger, createdAt: string) {
    await db.execute<ResultSetHeader>(
      `insert into point_ledger (
         id, family_id, child_user_id, change_amount, balance_after,
         reason, source_type, source_id, operator_user_id, created_at
       ) values (
         :id, :familyId, :childUserId, :changeAmount, :balanceAfter,
         :reason, :sourceType, :sourceId, :operatorUserId, :createdAt
       )`,
      {
        id: ledger.id,
        familyId: ledger.familyId,
        childUserId: ledger.childUserId,
        changeAmount: ledger.changeAmount,
        balanceAfter: ledger.balanceAfter,
        reason: ledger.reason,
        sourceType: ledger.sourceType,
        sourceId: ledger.sourceId,
        operatorUserId: ledger.operatorUserId,
        createdAt
      }
    );
  }

  private async findWishForUpdate(db: PoolConnection, wishId: string) {
    const [rows] = await db.execute<WishRow[]>(
      `select *
       from wish
       where id = :wishId
       limit 1
       for update`,
      { wishId }
    );

    return rows[0] ? mapWish(rows[0]) : undefined;
  }

  private async markWishRedeemed(db: PoolConnection, wishId: string, parentUserId: string, redeemedAt: string) {
    await db.execute<ResultSetHeader>(
      `update wish
       set status = 'redeemed',
           parent_user_id = :parentUserId,
           redeemed_at = :redeemedAt,
           updated_at = :redeemedAt
       where id = :wishId`,
      { wishId, parentUserId, redeemedAt }
    );
  }

  private async markWishRedeemRejected(db: PoolConnection, wishId: string, parentUserId: string, updatedAt: string) {
    await db.execute<ResultSetHeader>(
      `update wish
       set status = 'approved',
           parent_user_id = :parentUserId,
           current_redeem_request_id = null,
           updated_at = :updatedAt
       where id = :wishId and status = 'redeem_requested'`,
      { wishId, parentUserId, updatedAt }
    );
  }

  private async resolveRedeemRequest(
    db: PoolConnection,
    requestId: string,
    status: "confirmed" | "rejected",
    parentUserId: string,
    rejectReason: string | undefined,
    resolvedAt: string
  ) {
    await db.execute<ResultSetHeader>(
      `update wish_redeem_request
       set status = :status,
           reject_reason = :rejectReason,
           parent_user_id = :parentUserId,
           resolved_at = :resolvedAt
       where id = :requestId and status = 'pending'`,
      {
        requestId,
        status,
        rejectReason: rejectReason ?? null,
        parentUserId,
        resolvedAt
      }
    );
  }
}

function mapAccount(row: AccountRow): ChildPointAccount {
  return {
    id: row.id,
    familyId: row.family_id,
    childUserId: row.child_user_id,
    balance: row.balance,
    totalEarned: row.total_earned,
    totalSpent: row.total_spent,
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at)
  };
}

function mapLedger(row: LedgerRow): PointLedger {
  return {
    id: row.id,
    familyId: row.family_id,
    childUserId: row.child_user_id,
    changeAmount: row.change_amount,
    balanceAfter: row.balance_after,
    reason: row.reason,
    sourceType: row.source_type,
    sourceId: row.source_id,
    operatorUserId: row.operator_user_id,
    createdAt: toIsoDateTime(row.created_at)
  };
}

function mapWish(row: WishRow): Wish {
  return {
    id: row.id,
    familyId: row.family_id,
    childUserId: row.child_user_id,
    title: row.title,
    description: row.description ?? undefined,
    requiredPoints: row.required_points ?? undefined,
    status: row.status,
    parentUserId: row.parent_user_id ?? undefined,
    rejectReason: row.reject_reason ?? undefined,
    currentRedeemRequestId: row.current_redeem_request_id ?? undefined,
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at),
    redeemedAt: row.redeemed_at ? toIsoDateTime(row.redeemed_at) : undefined
  };
}

function mapRedeemRequest(row: WishRedeemRequestRow): WishRedeemRequest {
  return {
    id: row.id,
    wishId: row.wish_id,
    familyId: row.family_id,
    childUserId: row.child_user_id,
    requiredPoints: row.required_points,
    status: row.status,
    rejectReason: row.reject_reason ?? undefined,
    parentUserId: row.parent_user_id ?? undefined,
    requestedAt: toIsoDateTime(row.requested_at),
    resolvedAt: row.resolved_at ? toIsoDateTime(row.resolved_at) : undefined
  };
}

function assertWish(wish: Wish | undefined) {
  if (!wish) {
    throw new AppError(404, "NOT_FOUND", "Wish not found");
  }
  return wish;
}

function currentTimestamp() {
  const iso = new Date().toISOString();
  return {
    iso,
    mysql: iso.slice(0, 23).replace("T", " ")
  };
}

function toIsoDateTime(value: string) {
  return value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
}
