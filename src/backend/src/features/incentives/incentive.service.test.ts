import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../../shared/errors.js";
import type { User, Wish } from "../../domain/types.js";
import type { IncentiveRepository } from "./incentive.repository.js";
import { IncentiveService } from "./incentive.service.js";

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

const approvedWish: Wish = {
  id: "wish-1",
  familyId: "family-1",
  childUserId: "child-1",
  title: "周末去科技馆",
  requiredPoints: 50,
  status: "approved",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z"
};

const redeemedWish: Wish = {
  ...approvedWish,
  status: "redeemed",
  redeemedAt: "2026-06-02T10:00:00.000Z"
};

describe("IncentiveService", () => {
  it("requires parent users to pass a childUserId when reading point accounts", async () => {
    const service = new IncentiveService(mockRepository({}) as IncentiveRepository);

    await assert.rejects(() => service.getPointAccount(parent), (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal((error as AppError).code, "VALIDATION_ERROR");
      return true;
    });
  });

  it("blocks a child from reading another child's point account", async () => {
    const service = new IncentiveService(mockRepository({}) as IncentiveRepository);

    await assert.rejects(() => service.getPointAccount(child, "child-2"), (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal((error as AppError).code, "FORBIDDEN");
      return true;
    });
  });

  it("blocks redeem requests when the child does not have enough points", async () => {
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => approvedWish,
        requestRedeem: async () => {
          throw new AppError(409, "INSUFFICIENT_POINTS", "Current points are not enough for this wish");
        }
      }) as IncentiveRepository
    );

    await assert.rejects(() => service.requestRedeem(child, "wish-1"), (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal((error as AppError).code, "INSUFFICIENT_POINTS");
      return true;
    });
  });

  it("returns the debit ledger when a child requests redemption", async () => {
    const debitLedger = {
      id: "ledger-1",
      familyId: "family-1",
      childUserId: "child-1",
      changeAmount: -50,
      balanceAfter: 20,
      reason: "wish_redeem" as const,
      sourceType: "wish" as const,
      sourceId: "request-1",
      operatorUserId: "child-1",
      createdAt: "2026-06-02T00:00:00.000Z"
    };
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => approvedWish,
        requestRedeem: async () => ({
          wish: {
            ...approvedWish,
            status: "redeem_requested",
            currentRedeemRequestId: "request-1"
          },
          ledger: debitLedger
        })
      }) as IncentiveRepository
    );

    const result = await service.requestRedeem(child, "wish-1");

    assert.equal(result.wish.status, "redeem_requested");
    assert.equal(result.ledger, debitLedger);
  });

  it("confirms redemption without creating another point ledger", async () => {
    const requestedWish: Wish = {
      ...approvedWish,
      status: "redeem_requested",
      currentRedeemRequestId: "request-1"
    };
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => requestedWish,
        confirmRedeem: async () => ({ ...requestedWish, status: "redeemed" })
      }) as IncentiveRepository
    );

    const result = await service.confirmRedeem(parent, "wish-1");

    assert.equal(result.status, "redeemed");
  });

  it("returns the refund ledger and makes a rejected redemption redeemable again", async () => {
    const requestedWish: Wish = {
      ...approvedWish,
      status: "redeem_requested",
      currentRedeemRequestId: "request-1"
    };
    const refundLedger = {
      id: "ledger-2",
      familyId: "family-1",
      childUserId: "child-1",
      changeAmount: 50,
      balanceAfter: 70,
      reason: "wish_refund" as const,
      sourceType: "wish" as const,
      sourceId: "request-1",
      operatorUserId: "parent-1",
      createdAt: "2026-06-02T01:00:00.000Z"
    };
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => requestedWish,
        rejectRedeem: async () => ({
          wish: {
            ...approvedWish,
            status: "approved",
            currentRedeemRequestId: undefined
          },
          ledger: refundLedger
        })
      }) as IncentiveRepository
    );

    const result = await service.rejectRedeem(parent, "wish-1", "本周无法安排");

    assert.equal(result.wish.status, "approved");
    assert.equal(result.ledger, refundLedger);
  });

  it("restores a legacy redemption request without creating a refund ledger", async () => {
    const legacyRequestedWish: Wish = {
      ...approvedWish,
      status: "redeem_requested"
    };
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => legacyRequestedWish,
        rejectRedeem: async () => ({
          wish: { ...approvedWish, status: "approved" },
          ledger: null
        })
      }) as IncentiveRepository
    );

    const result = await service.rejectRedeem(parent, "wish-1", "本周无法安排");

    assert.equal(result.wish.status, "approved");
    assert.equal(result.ledger, null);
  });

  it("blocks a second redemption decision after the wish leaves requested status", async () => {
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => approvedWish
      }) as IncentiveRepository
    );

    await assert.rejects(() => service.rejectRedeem(parent, "wish-1", "本周无法安排"), (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal((error as AppError).code, "WISH_REDEEM_NOT_REJECTABLE");
      return true;
    });
  });

  it("sends only required points to repository when parent approves a wish", async () => {
    let approvedRequiredPoints = 0;
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => ({
          ...approvedWish,
          requiredPoints: undefined,
          status: "pending_review"
        }),
        approveWish: async (_wishId, requiredPoints) => {
          approvedRequiredPoints = requiredPoints;
          return {
            ...approvedWish,
            requiredPoints,
            status: "approved"
          };
        }
      }) as IncentiveRepository
    );

    const wish = await service.approveWish(parent, "wish-1", { requiredPoints: 80 });

    assert.equal(approvedRequiredPoints, 80);
    assert.equal(wish.title, approvedWish.title);
    assert.equal(wish.requiredPoints, 80);
  });

  it("allows a child to update their own rejected wish", async () => {
    const rejectedWish: Wish = {
      ...approvedWish,
      status: "rejected",
      rejectReason: "本周先完成读书计划"
    };
    const updatePayload: { wishId: string; input: { title: string; description?: string } } = {
      wishId: "",
      input: { title: "", description: undefined }
    };
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => rejectedWish,
        updateWish: async (wishId, input) => {
          updatePayload.wishId = wishId;
          updatePayload.input = input;
          return { ...rejectedWish, title: input.title, status: "pending_review", rejectReason: undefined };
        }
      }) as IncentiveRepository
    );

    const wish = await service.updateWish(child, "wish-1", {
      title: "周末去图书馆",
      description: "想看新到的科普书"
    });

    assert.equal(updatePayload.wishId, "wish-1");
    assert.equal(updatePayload.input.title, "周末去图书馆");
    assert.equal(updatePayload.input.description, "想看新到的科普书");
    assert.equal(wish.status, "pending_review");
  });

  it("blocks a child from updating a wish that is not rejected", async () => {
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => approvedWish
      }) as IncentiveRepository
    );

    await assert.rejects(
      () => service.updateWish(child, "wish-1", { title: "新标题" }),
      (error) => {
        assert.equal(error instanceof AppError, true);
        assert.equal((error as AppError).code, "WISH_NOT_EDITABLE");
        return true;
      }
    );
  });

  it("blocks a child from updating another child's wish", async () => {
    const otherChildWish: Wish = { ...approvedWish, childUserId: "child-2", status: "rejected" };
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => otherChildWish
      }) as IncentiveRepository
    );

    await assert.rejects(
      () => service.updateWish(child, "wish-1", { title: "新标题" }),
      (error) => {
        assert.equal(error instanceof AppError, true);
        assert.equal((error as AppError).code, "FORBIDDEN");
        return true;
      }
    );
  });

  it("blocks a parent from updating a child's wish", async () => {
    const service = new IncentiveService(mockRepository({}) as IncentiveRepository);

    await assert.rejects(
      () => service.updateWish(parent, "wish-1", { title: "新标题" }),
      (error) => {
        assert.equal(error instanceof AppError, true);
        assert.equal((error as AppError).code, "FORBIDDEN");
        return true;
      }
    );
  });

  it("allows a child to delete their own rejected wish", async () => {
    const rejectedWish: Wish = { ...approvedWish, status: "rejected" };
    let deletedStatus = "";
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => rejectedWish,
        deleteWish: async (wishId, requiredStatus) => {
          deletedStatus = requiredStatus;
          return { wishId, deleted: true };
        }
      }) as IncentiveRepository
    );

    await service.deleteWish(child, "wish-1");
    assert.equal(deletedStatus, "rejected");
  });

  it("blocks a child from deleting a wish that is not rejected", async () => {
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => approvedWish
      }) as IncentiveRepository
    );

    await assert.rejects(() => service.deleteWish(child, "wish-1"), (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal((error as AppError).code, "WISH_NOT_DELETABLE");
      return true;
    });
  });

  it("blocks a child from deleting another child's wish", async () => {
    const otherChildWish: Wish = { ...approvedWish, childUserId: "child-2", status: "rejected" };
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => otherChildWish
      }) as IncentiveRepository
    );

    await assert.rejects(() => service.deleteWish(child, "wish-1"), (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal((error as AppError).code, "FORBIDDEN");
      return true;
    });
  });

  it("blocks a child from deleting a redeemed wish", async () => {
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => redeemedWish
      }) as IncentiveRepository
    );

    await assert.rejects(() => service.deleteWish(child, "wish-1"), (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal((error as AppError).code, "WISH_NOT_DELETABLE");
      return true;
    });
  });

  it("blocks a parent from deleting a redeemed wish", async () => {
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => redeemedWish
      }) as IncentiveRepository
    );

    await assert.rejects(() => service.deleteWish(parent, "wish-1"), (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal((error as AppError).code, "FORBIDDEN");
      return true;
    });
  });

  it("blocks a parent from deleting a wish outside the current family", async () => {
    const otherFamilyWish: Wish = { ...redeemedWish, familyId: "family-2" };
    const service = new IncentiveService(
      mockRepository({
        findWishById: async () => otherFamilyWish
      }) as IncentiveRepository
    );

    await assert.rejects(() => service.deleteWish(parent, "wish-1"), (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal((error as AppError).code, "FORBIDDEN");
      return true;
    });
  });
});

function mockRepository(overrides: Partial<IncentiveRepository>) {
  return {
    isFamilyChild: async () => true,
    getOrCreateAccount: async () => ({
      id: "account-1",
      familyId: "family-1",
      childUserId: "child-1",
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z"
    }),
    listLedger: async () => [],
    findWishById: async () => undefined,
    findLatestRedeemRequest: async () => undefined,
    updateWish: async () => undefined,
    deleteWish: async (_wishId: string, requiredStatus: Wish["status"]) => ({ wishId: "", deleted: true, requiredStatus }),
    ...overrides
  };
}
