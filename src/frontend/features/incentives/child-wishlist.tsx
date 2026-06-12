"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AppButton, AppButtonLink } from "@/components/ui/button";
import { AppCard, AppCardTitle } from "@/components/ui/card";
import { AppConfirmModal } from "@/components/ui/modal";
import {
  ApiError,
  deleteWish,
  getPointAccount,
  getWishes,
  requestWishRedeem
} from "@/features/api/client";
import { pointLedgerReasonLabel, wishStatusLabel, wishStatusTone } from "@/features/incentives/wish-status";
import {
  WishRedeemCelebration
} from "@/features/incentives/wish-redeem-celebration";
import type { ChildPointAccount, PointLedger, Wish } from "@/features/tasks/types";

const WISH_REDEEM_SOUND_STORAGE_KEY = "zhizhi:wish-redeem-sound-enabled";

export function ChildWishlist() {
  const [account, setAccount] = useState<ChildPointAccount | null>(null);
  const [ledger, setLedger] = useState<PointLedger[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionWishId, setActionWishId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Wish | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [redeemAnnouncement, setRedeemAnnouncement] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const [pointResult, wishResult] = await Promise.all([getPointAccount(), getWishes()]);
        if (!active) {
          return;
        }
        setAccount(pointResult.account);
        setLedger(pointResult.ledger);
        setWishes(wishResult.wishes);
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "加载心愿清单失败");
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

  useEffect(() => {
    try {
      const storedPreference = window.localStorage.getItem(WISH_REDEEM_SOUND_STORAGE_KEY);
      if (storedPreference !== null) {
        setSoundEnabled(storedPreference === "true");
      }
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }, []);

  const closeCelebration = useCallback(() => {
    setCelebrationOpen(false);
  }, []);

  function toggleSound() {
    setSoundEnabled((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(WISH_REDEEM_SOUND_STORAGE_KEY, String(next));
      } catch {
        // The preference remains active for the current page when storage fails.
      }
      return next;
    });
  }

  async function handleRedeem(wish: Wish) {
    setError("");
    setMessage("");
    setRedeemAnnouncement("");
    setActionWishId(wish.id);

    try {
      const result = await requestWishRedeem(wish.id);
      setWishes((prev) => prev.map((item) => (item.id === wish.id ? result.wish : item)));
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
      setRedeemAnnouncement("兑换申请成功。");
      setCelebrationOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "申请兑换失败");
    } finally {
      setActionWishId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setError("");
    setMessage("");
    setRedeemAnnouncement("");
    setActionWishId(deleteTarget.id);

    try {
      await deleteWish(deleteTarget.id);
      setWishes((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setMessage("已删除该心愿。");
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除心愿失败");
    } finally {
      setActionWishId(null);
    }
  }

  const balance = account?.balance ?? 0;

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div className="grid gap-5 rounded-[32px] bg-[#fffdf2] p-5 shadow-[0_10px_0_rgba(114,93,66,0.08)] md:grid-cols-[1fr_auto] md:items-end md:p-6">
        <div>
          <p className="text-caption-uppercase text-muted">Wish island</p>
          <h1 className="mt-3 text-display-sm tracking-normal text-ink">我的心愿清单</h1>
          <p className="mt-3 max-w-2xl text-body-sm text-body">
            把想实现的小目标放进清单，积分够了就发起兑换申请。
          </p>
        </div>
        <div className="grid gap-2">
          <div className="rounded-[24px] bg-[#82d5bb] px-6 py-4 text-center text-white shadow-[inset_0_-5px_0_rgba(68,129,111,0.35)]">
            <p className="text-caption font-semibold text-white/80">当前积分</p>
            <p className="mt-1 text-display-sm tracking-normal text-white">{isLoading ? "-" : balance}</p>
          </div>
          <button
            type="button"
            className="wish-redeem-sound-toggle"
            aria-pressed={soundEnabled}
            onClick={toggleSound}
          >
            <span aria-hidden="true">{soundEnabled ? "♪" : "×"}</span>
            奖励音效：{soundEnabled ? "开启" : "静音"}
          </button>
        </div>
      </div>

      {error ? <AppCard className="text-body-sm text-brand-coral">{error}</AppCard> : null}
      {message ? <AppCard variant="mint" className="text-body-sm text-white">{message}</AppCard> : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-5">
          <AppCard className="!p-4 md:!p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <AppCardTitle className="text-title-sm">提交新心愿</AppCardTitle>
                <p className="mt-1 text-body-sm text-muted">
                  写下想实现的小目标，家长会设置所需积分。
                </p>
              </div>
              <AppButtonLink href="/child/wishes/new" className="w-full md:w-fit">
                去提交
              </AppButtonLink>
            </div>
          </AppCard>

          <AppCard className="p-0 md:p-0">
            <div className="px-5 pt-5 md:px-6 md:pt-6">
              <AppCardTitle>心愿列表</AppCardTitle>
            </div>
            <div className="mt-4 grid gap-3 px-4 pb-4 md:px-5 md:pb-5">
              {wishes.map((wish) => {
                const requiredPoints = wish.requiredPoints ?? 0;
                const canRedeem = wish.status === "approved" && balance >= requiredPoints;
                const remainingPoints = Math.max(0, requiredPoints - balance);
                const progress = requiredPoints > 0 ? Math.min(100, Math.round((balance / requiredPoints) * 100)) : 0;

                return (
                  <div key={wish.id} className="grid gap-4 rounded-[24px] border-2 border-[#eadfc3] bg-[#fffdf8] p-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={wishStatusTone[wish.status]}>{wishStatusLabel[wish.status]}</Badge>
                        {wish.requiredPoints ? <Badge tone="lavender">{wish.requiredPoints} 积分</Badge> : null}
                      </div>
                      <h2 className="mt-3 text-title-md text-ink">{wish.title}</h2>
                      {wish.description ? <p className="mt-1 text-body-sm text-muted">{wish.description}</p> : null}
                      {wish.rejectReason ? <p className="mt-2 text-caption text-brand-coral">驳回原因：{wish.rejectReason}</p> : null}
                      {wish.latestRedeemRequest?.status === "rejected" ? (
                        <p className="mt-3 rounded-[18px] bg-[#fff1eb] p-3 text-body-sm text-brand-coral">
                          上次兑换未能兑现，已退回 {wish.latestRedeemRequest.requiredPoints} 积分。
                          {wish.latestRedeemRequest.rejectReason ? ` 原因：${wish.latestRedeemRequest.rejectReason}` : ""}
                        </p>
                      ) : null}
                    </div>
                    {wish.requiredPoints !== undefined && wish.status !== "pending_review" && wish.status !== "rejected" ? (
                      <div className="grid gap-2 md:col-span-2">
                        <div className="flex justify-between text-caption text-muted">
                          <span>当前 {balance} / 需要 {requiredPoints}</span>
                          <span>{remainingPoints > 0 ? `还差 ${remainingPoints} 分` : "积分已达成"}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#eadfc3]">
                          <div
                            className="h-full rounded-full bg-[#82d5bb] transition-[width]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                    {wish.status === "approved" ? (
                      <div className="flex items-center md:col-start-2 md:row-start-1 md:justify-end">
                        <AppButton
                          type="button"
                          disabled={!canRedeem || actionWishId === wish.id}
                          onClick={() => void handleRedeem(wish)}
                        >
                          {actionWishId === wish.id ? "申请中..." : canRedeem ? "申请兑换" : "积分不足"}
                        </AppButton>
                      </div>
                    ) : null}
                    {wish.status === "rejected" ? (
                      <div className="flex flex-wrap items-center gap-3 md:col-start-2 md:row-start-1 md:justify-end">
                        <AppButtonLink
                          href={`/child/wishes/${encodeURIComponent(wish.id)}/edit`}
                          variant="secondary"
                        >
                          修改心愿
                        </AppButtonLink>
                        <AppButton
                          type="button"
                          variant="danger"
                          disabled={actionWishId === wish.id}
                          onClick={() => setDeleteTarget(wish)}
                        >
                          删除心愿
                        </AppButton>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {!isLoading && wishes.length === 0 ? (
                <p className="rounded-[22px] border-2 border-dashed border-[#eadfc3] bg-[#fffdf8] px-4 py-8 text-center text-body-sm text-muted">
                  还没有提交心愿。
                </p>
              ) : null}
            </div>
          </AppCard>
        </div>

        <AppCard className="overflow-hidden lg:sticky lg:top-24">
          <AppCardTitle>积分流水</AppCardTitle>
          <div className="mt-4 grid gap-3">
            {ledger.map((item) => (
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
        open={Boolean(deleteTarget)}
        title="删除心愿"
        description="删除后无法恢复，需要重新提交心愿。"
        detail={deleteTarget ? `心愿：${deleteTarget.title}` : undefined}
        confirmText="删除心愿"
        tone="danger"
        loading={Boolean(deleteTarget && actionWishId === deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />

      <WishRedeemCelebration
        open={celebrationOpen}
        soundEnabled={soundEnabled}
        onClose={closeCelebration}
      />
      <p className="sr-only" role="status" aria-live="polite">
        {redeemAnnouncement}
      </p>
    </div>
  );
}
