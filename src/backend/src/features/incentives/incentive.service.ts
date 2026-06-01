import { AppError, assertFound } from "../../shared/errors.js";
import type { StudyTask, User, Wish } from "../../domain/types.js";
import type { z } from "zod";
import type {
  approveWishSchema,
  createWishSchema,
  rejectWishSchema,
  updateWishSchema
} from "./incentive.schemas.js";
import type { IncentiveRepository } from "./incentive.repository.js";

type CreateWishInput = z.infer<typeof createWishSchema>;
type UpdateWishInput = z.infer<typeof updateWishSchema>;
type ApproveWishInput = z.infer<typeof approveWishSchema>;
type RejectWishInput = z.infer<typeof rejectWishSchema>;

export class IncentiveService {
  constructor(private readonly repository: IncentiveRepository) {}

  async getPointAccount(user: User, childUserId?: string) {
    const targetChildUserId = await this.resolveChildUserId(user, childUserId);
    const account = await this.repository.getOrCreateAccount(user.familyId, targetChildUserId);

    return {
      account,
      ledger: await this.repository.listLedger(user.familyId, targetChildUserId)
    };
  }

  async awardTaskReward(parent: User, task: StudyTask, _reviewId: string) {
    this.assertParent(parent);

    if (parent.familyId !== task.familyId) {
      throw new AppError(403, "FORBIDDEN", "Task is outside current family");
    }

    return this.repository.awardTaskReward(task, parent.id);
  }

  async listWishes(user: User, childUserId?: string) {
    if (user.role === "child") {
      return this.repository.listWishes(user.familyId, user.id);
    }

    const targetChildUserId = childUserId ? await this.resolveChildUserId(user, childUserId) : undefined;
    return this.repository.listWishes(user.familyId, targetChildUserId);
  }

  async createWish(child: User, input: CreateWishInput) {
    if (child.role !== "child") {
      throw new AppError(403, "FORBIDDEN", "Only children can submit wishes");
    }

    return this.repository.createWish({
      familyId: child.familyId,
      childUserId: child.id,
      title: input.title,
      description: input.description
    });
  }

  async getWish(user: User, wishId: string) {
    const wish = await this.getFamilyWish(user, wishId);

    if (user.role === "child" && wish.childUserId !== user.id) {
      throw new AppError(403, "FORBIDDEN", "Wish is outside current child");
    }

    return wish;
  }

  async updateWish(child: User, wishId: string, input: UpdateWishInput) {
    if (child.role !== "child") {
      throw new AppError(403, "FORBIDDEN", "Only children can modify wishes");
    }

    const wish = await this.getFamilyWish(child, wishId);

    if (wish.childUserId !== child.id) {
      throw new AppError(403, "FORBIDDEN", "Wish is outside current child");
    }

    if (wish.status !== "rejected") {
      throw new AppError(409, "WISH_NOT_EDITABLE", "Only rejected wishes can be modified");
    }

    return assertFound(
      await this.repository.updateWish(wishId, {
        title: input.title,
        description: input.description
      }),
      "Wish not found"
    );
  }

  async deleteWish(child: User, wishId: string) {
    if (child.role !== "child") {
      throw new AppError(403, "FORBIDDEN", "Only children can delete wishes");
    }

    const wish = await this.getFamilyWish(child, wishId);

    if (wish.childUserId !== child.id) {
      throw new AppError(403, "FORBIDDEN", "Wish is outside current child");
    }

    if (wish.status !== "rejected") {
      throw new AppError(409, "WISH_NOT_DELETABLE", "Only rejected wishes can be deleted");
    }

    await this.repository.deleteWish(wishId);
  }

  async approveWish(parent: User, wishId: string, input: ApproveWishInput) {
    this.assertParent(parent);
    const wish = await this.getFamilyWish(parent, wishId);

    if (wish.status !== "pending_review") {
      throw new AppError(409, "WISH_NOT_REVIEWABLE", "Wish cannot be approved in current status");
    }

    return assertFound(await this.repository.approveWish(wishId, input.requiredPoints, parent.id), "Wish not found");
  }

  async rejectWish(parent: User, wishId: string, input: RejectWishInput) {
    this.assertParent(parent);
    const wish = await this.getFamilyWish(parent, wishId);

    if (wish.status !== "pending_review") {
      throw new AppError(409, "WISH_NOT_REVIEWABLE", "Wish cannot be rejected in current status");
    }

    return assertFound(await this.repository.rejectWish(wishId, input.rejectReason, parent.id), "Wish not found");
  }

  async requestRedeem(child: User, wishId: string) {
    if (child.role !== "child") {
      throw new AppError(403, "FORBIDDEN", "Only children can request wish redemption");
    }

    const wish = await this.getFamilyWish(child, wishId);

    if (wish.childUserId !== child.id) {
      throw new AppError(403, "FORBIDDEN", "Wish is outside current child");
    }

    if (wish.status !== "approved" || wish.requiredPoints === undefined) {
      throw new AppError(409, "WISH_NOT_REDEEMABLE", "Wish cannot be redeemed in current status");
    }

    const { account } = await this.getPointAccount(child);
    if (account.balance < wish.requiredPoints) {
      throw new AppError(409, "INSUFFICIENT_POINTS", "Current points are not enough for this wish");
    }

    return assertFound(await this.repository.requestRedeem(wishId), "Wish not found");
  }

  async confirmRedeem(parent: User, wishId: string) {
    this.assertParent(parent);
    const wish = await this.getFamilyWish(parent, wishId);

    if (wish.status !== "redeem_requested" || wish.requiredPoints === undefined) {
      throw new AppError(409, "WISH_NOT_CONFIRMABLE", "Wish redemption cannot be confirmed in current status");
    }

    const { account } = await this.getPointAccount(parent, wish.childUserId);
    if (account.balance < wish.requiredPoints) {
      throw new AppError(409, "INSUFFICIENT_POINTS", "Current points are not enough for this wish");
    }

    const result = await this.repository.confirmRedeem(wish, parent.id);

    if (!result.wish) {
      throw new AppError(404, "NOT_FOUND", "Wish not found");
    }

    return result;
  }

  private async resolveChildUserId(user: User, childUserId?: string) {
    if (user.role === "child") {
      if (childUserId && childUserId !== user.id) {
        throw new AppError(403, "FORBIDDEN", "Child cannot access another child's points");
      }

      return user.id;
    }

    if (!childUserId) {
      throw new AppError(400, "VALIDATION_ERROR", "childUserId is required for parent users");
    }

    if (!(await this.repository.isFamilyChild(user.familyId, childUserId))) {
      throw new AppError(403, "FORBIDDEN", "Child is outside current family");
    }

    return childUserId;
  }

  private async getFamilyWish(user: User, wishId: string): Promise<Wish> {
    const wish = assertFound(await this.repository.findWishById(wishId), "Wish not found");

    if (wish.familyId !== user.familyId) {
      throw new AppError(403, "FORBIDDEN", "Wish is outside current family");
    }

    return wish;
  }

  private assertParent(user: User) {
    if (user.role !== "parent") {
      throw new AppError(403, "FORBIDDEN", "Only parents can perform this operation");
    }
  }
}
