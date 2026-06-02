import { randomUUID } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { ChildPointAccount, PointLedger, StudyTask, Wish } from "../../domain/types.js";
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
  created_at: string;
  updated_at: string;
  redeemed_at: string | null;
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

    return this.withTransaction(async (connection) => {
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
    });
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

  async requestRedeem(wishId: string) {
    const now = currentTimestamp();
    await this.db.execute<ResultSetHeader>(
      `update wish
       set status = 'redeem_requested',
           updated_at = :updatedAt
       where id = :wishId and status = 'approved'`,
      { wishId, updatedAt: now.mysql }
    );

    return this.findWishById(wishId);
  }

  async confirmRedeem(wish: Wish, parentUserId: string) {
    return this.withTransaction(async (connection) => {
      const lockedWish = await this.findWishForUpdate(connection, wish.id);

      if (!lockedWish || lockedWish.status !== "redeem_requested" || lockedWish.requiredPoints === undefined) {
        return { wish: lockedWish, ledger: null };
      }

      await this.ensureAccount(connection, lockedWish.familyId, lockedWish.childUserId);
      const existingLedger = await this.findLedgerBySource(connection, lockedWish.familyId, "wish", lockedWish.id);
      const now = currentTimestamp();

      if (existingLedger) {
        await this.markWishRedeemed(connection, lockedWish.id, parentUserId, now.mysql);
        return { wish: await this.findWishForUpdate(connection, lockedWish.id), ledger: existingLedger };
      }

      const account = await this.findAccountForUpdate(connection, lockedWish.familyId, lockedWish.childUserId);
      if (account.balance < lockedWish.requiredPoints) {
        throw new AppError(409, "INSUFFICIENT_POINTS", "Current points are not enough for this wish");
      }

      const nextBalance = account.balance - lockedWish.requiredPoints;
      const ledger: PointLedger = {
        id: randomUUID(),
        familyId: lockedWish.familyId,
        childUserId: lockedWish.childUserId,
        changeAmount: -lockedWish.requiredPoints,
        balanceAfter: nextBalance,
        reason: "wish_redeem",
        sourceType: "wish",
        sourceId: lockedWish.id,
        operatorUserId: parentUserId,
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
      await this.markWishRedeemed(connection, lockedWish.id, parentUserId, now.mysql);

      return { wish: await this.findWishForUpdate(connection, lockedWish.id), ledger };
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
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at),
    redeemedAt: row.redeemed_at ? toIsoDateTime(row.redeemed_at) : undefined
  };
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
