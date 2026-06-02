"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/ui/button";
import { AppCard, AppCardTitle } from "@/components/ui/card";
import { AppConfirmModal } from "@/components/ui/modal";
import {
  ApiError,
  approveWish,
  confirmWishRedeem,
  deleteWish,
  getPointAccount,
  getWishes,
  rejectWish
} from "@/features/api/client";
import { pointLedgerReasonLabel, wishStatusLabel, wishStatusTone } from "@/features/incentives/wish-status";
import type { ChildPointAccount, PointLedger, Wish } from "@/features/tasks/types";

const demoChild = { id: "child-1", nickname: "孩子 Demo" };

export function ParentWishlist() {
  const [account, setAccount] = useState<ChildPointAccount | null>(null);
  const [ledger, setLedger] = useState<PointLedger[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [requiredPointsByWish, setRequiredPointsByWish] = useState<Record<string, string>>({});
  const [rejectReasonByWish, setRejectReasonByWish] = useState<Record<string, string>>({});
  const [confirmTarget, setConfirmTarget] = useState<Wish | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Wish | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionWishId, setActionWishId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const [pointResult, wishResult] = await Promise.all([
          getPointAccount({ childUserId: demoChild.id }),
          getWishes({ childUserId: demoChild.id })
        ]);
        if (!active) {
          return;
        }
        setAccount(pointResult.account);
        setLedger(pointResult.ledger);
        setWishes(wishResult.wishes);
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "加载愿望管理失败");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function handleApprove(event: FormEvent<HTMLFormElement>, wish: Wish) {
    event.preventDefault();
    const requiredPoints = Number.parseInt(requiredPointsByWish[wish.id] || "", 10);
    if (!Number.isInteger(requiredPoints) || requiredPoints < 1 || requiredPoints > 99999) {
      setError("请填写 1 到 99999 之间的所需积分");
      return;
    }

    setError("");
    setMessage("");
    setActionWishId(wish.id);

    try {
      const result = await approveWish(wish.id, { requiredPoints });
      replaceWish(result.wish);
      setMessage("已通过心愿并设置所需积分。");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "通过心愿失败");
    } finally {
      setActionWishId(null);
    }
  }

  async function handleReject(wish: Wish) {
    setError("");
    setMessage("");
    setActionWishId(wish.id);

    try {
      const result = await rejectWish(wish.id, {
        rejectReason: rejectReasonByWish[wish.id]?.trim() || undefined
      });
      replaceWish(result.wish);
      setMessage("已驳回心愿。");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "驳回心愿失败");
    } finally {
      setActionWishId(null);
    }
  }

  async function handleConfirmRedeem() {
    if (!confirmTarget) {
      return;
    }

    setError("");
    setMessage("");
    setActionWishId(confirmTarget.id);

    try {
      const result = await confirmWishRedeem(confirmTarget.id);
      replaceWish(result.wish);
      setLedger((prev) => [result.ledger, ...prev]);
      setAccount((prev) =>
        prev
          ? {
              ...prev,
              balance: result.ledger.balanceAfter,
              totalSpent: prev.totalSpent + Math.abs(result.ledger.changeAmount)
            }
          : prev
      );
      setConfirmTarget(null);
      setMessage("已确认兑换，积分已扣减。");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "确认兑换失败");
    } finally {
      setActionWishId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    setError("");
    setMessage("");
    setActionWishId(deleteTarget.id);

    try {
      await deleteWish(deleteTarget.id);
      setWishes((prev) => prev.filter((wish) => wish.id !== deleteTarget.id));
      setDeleteTarget(null);
      setMessage("已删除已兑换的心愿。");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除心愿失败");
    } finally {
      setActionWishId(null);
    }
  }

  function replaceWish(nextWish: Wish) {
    setWishes((prev) => prev.map((wish) => (wish.id === nextWish.id ? nextWish : wish)));
  }

  const balance = account?.balance ?? 0;
  const pendingCount = wishes.filter((wish) => wish.status === "pending_review").length;
  const redeemCount = wishes.filter((wish) => wish.status === "redeem_requested").length;

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div className="grid gap-5 rounded-[32px] bg-[#fffdf2] p-5 shadow-[0_10px_0_rgba(114,93,66,0.08)] md:grid-cols-[1fr_auto] md:items-end md:p-6">
        <div>
          <p className="text-caption-uppercase text-muted">Wish desk</p>
          <h1 className="mt-3 text-display-sm tracking-normal text-ink">愿望管理</h1>
          <p className="mt-3 max-w-2xl text-body-sm text-body">
            为孩子提交的心愿设置积分，处理兑换申请。心愿原文保持孩子提交内容。
          </p>
        </div>
        <div className="rounded-[24px] bg-[#f7cd67] px-6 py-4 text-center text-[#725d42] shadow-[inset_0_-5px_0_rgba(114,93,66,0.14)]">
          <p className="text-caption font-semibold">当前积分</p>
          <p className="mt-1 text-display-sm tracking-normal">{isLoading ? "-" : balance}</p>
        </div>
      </div>

      {error ? <AppCard className="text-body-sm text-brand-coral">{error}</AppCard> : null}
      {message ? <AppCard variant="mint" className="text-body-sm text-white">{message}</AppCard> : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AppCard variant="ochre" className="text-[#725d42]">
          <p className="text-caption text-[#725d42]/70">孩子</p>
          <p className="mt-2 text-title-md text-[#725d42]">{demoChild.nickname}</p>
        </AppCard>
        <AppCard variant="lavender" className="text-white">
          <p className="text-caption text-white/75">待设置积分</p>
          <p className="mt-2 text-display-sm tracking-normal text-white">{isLoading ? "-" : pendingCount}</p>
        </AppCard>
        <AppCard variant="peach" className="text-white">
          <p className="text-caption text-white/75">待确认兑换</p>
          <p className="mt-2 text-display-sm tracking-normal text-white">{isLoading ? "-" : redeemCount}</p>
        </AppCard>
        <AppCard variant="teal" className="text-white">
          <p className="text-caption text-white/75">累计获得</p>
          <p className="mt-2 text-display-sm tracking-normal text-white">{isLoading ? "-" : account?.totalEarned ?? 0}</p>
        </AppCard>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]">
        <AppCard className="p-0 md:p-0">
          <div className="px-5 pt-5 md:px-6 md:pt-6">
            <AppCardTitle>愿望列表</AppCardTitle>
          </div>
          <div className="mt-4 grid gap-3 px-4 pb-4 md:px-5 md:pb-5">
            {wishes.map((wish) => (
              <div key={wish.id} className="grid gap-4 rounded-[24px] border-2 border-[#eadfc3] bg-[#fffdf8] p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={wishStatusTone[wish.status]}>{wishStatusLabel[wish.status]}</Badge>
                    {wish.requiredPoints ? <Badge tone="lavender">{wish.requiredPoints} 积分</Badge> : null}
                  </div>
                  <h2 className="mt-3 text-title-md text-ink">{wish.title}</h2>
                  {wish.description ? <p className="mt-1 text-body-sm text-muted">{wish.description}</p> : null}
                  {wish.rejectReason ? <p className="mt-2 text-caption text-brand-coral">驳回原因：{wish.rejectReason}</p> : null}
                </div>

                {wish.status === "pending_review" ? (
                  <form className="grid gap-3 md:grid-cols-[160px_1fr_auto_auto] md:items-end" onSubmit={(event) => void handleApprove(event, wish)}>
                    <label>
                      所需积分
                      <input
                        type="number"
                        min={1}
                        max={99999}
                        value={requiredPointsByWish[wish.id] ?? ""}
                        onChange={(event) =>
                          setRequiredPointsByWish((prev) => ({ ...prev, [wish.id]: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      驳回原因
                      <input
                        value={rejectReasonByWish[wish.id] ?? ""}
                        onChange={(event) =>
                          setRejectReasonByWish((prev) => ({ ...prev, [wish.id]: event.target.value }))
                        }
                        maxLength={500}
                      />
                    </label>
                    <AppButton type="submit" disabled={actionWishId === wish.id}>
                      {actionWishId === wish.id ? "处理中..." : "通过"}
                    </AppButton>
                    <AppButton
                      type="button"
                      variant="secondary"
                      disabled={actionWishId === wish.id}
                      onClick={() => void handleReject(wish)}
                    >
                      驳回
                    </AppButton>
                  </form>
                ) : null}

                {wish.status === "redeem_requested" ? (
                  <div className="flex justify-start">
                    <AppButton type="button" onClick={() => setConfirmTarget(wish)}>
                      确认兑换
                    </AppButton>
                  </div>
                ) : null}

                {wish.status === "redeemed" ? (
                  <div className="flex justify-start">
                    <AppButton
                      type="button"
                      variant="secondary"
                      disabled={actionWishId === wish.id}
                      onClick={() => setDeleteTarget(wish)}
                    >
                      {actionWishId === wish.id ? "处理中..." : "删除心愿"}
                    </AppButton>
                  </div>
                ) : null}
              </div>
            ))}
            {!isLoading && wishes.length === 0 ? (
              <p className="rounded-[22px] border-2 border-dashed border-[#eadfc3] bg-[#fffdf8] px-4 py-8 text-center text-body-sm text-muted">
                暂无孩子提交的心愿。
              </p>
            ) : null}
          </div>
        </AppCard>

        <AppCard className="overflow-hidden">
          <AppCardTitle>积分流水</AppCardTitle>
          <div className="mt-4 grid gap-3">
            {ledger.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-[20px] bg-[#fffdf8] px-4 py-3 text-body-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-ink">{pointLedgerReasonLabel[item.reason]}</span>
                  <span className={item.changeAmount >= 0 ? "text-[#3a8f77]" : "text-brand-coral"}>
                    {item.changeAmount >= 0 ? "+" : ""}
                    {item.changeAmount}
                  </span>
                </div>
                <p className="mt-1 text-caption text-muted">余额 {item.balanceAfter}</p>
              </div>
            ))}
            {!isLoading && ledger.length === 0 ? <p className="text-body-sm text-muted">还没有积分记录。</p> : null}
          </div>
        </AppCard>
      </div>

      <AppConfirmModal
        open={Boolean(confirmTarget)}
        title="确认兑换"
        description="确认后会扣减孩子积分，并将心愿标记为已兑换。"
        detail={confirmTarget ? `${confirmTarget.title}：${confirmTarget.requiredPoints ?? 0} 积分` : undefined}
        confirmText="确认兑换"
        loading={Boolean(confirmTarget && actionWishId === confirmTarget.id)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => void handleConfirmRedeem()}
      />

      <AppConfirmModal
        open={Boolean(deleteTarget)}
        title="删除已兑换的心愿"
        description="删除后将从心愿清单移除该记录，且无法恢复。"
        detail={deleteTarget ? deleteTarget.title : undefined}
        confirmText="删除心愿"
        tone="danger"
        loading={Boolean(deleteTarget && actionWishId === deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
