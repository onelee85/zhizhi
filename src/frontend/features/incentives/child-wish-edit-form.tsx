"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton, AppButtonLink } from "@/components/ui/button";
import { AppCard, AppCardTitle } from "@/components/ui/card";
import { ApiError, updateWish } from "@/features/api/client";
import type { Wish } from "@/features/tasks/types";

export function ChildWishEditForm({ wish }: { wish: Wish }) {
  const router = useRouter();
  const [title, setTitle] = useState(wish.title);
  const [description, setDescription] = useState(wish.description ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("请填写心愿标题");
      return;
    }

    setSubmitting(true);
    try {
      await updateWish(wish.id, {
        title: title.trim(),
        description: description.trim() || undefined
      });
      router.push("/child/wishes");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "修改心愿失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div className="grid gap-3 rounded-[32px] bg-[#fffdf2] p-5 shadow-[0_10px_0_rgba(114,93,66,0.08)] md:p-6">
        <p className="text-caption-uppercase text-muted">Edit wish</p>
        <h1 className="text-display-sm tracking-normal text-ink">修改心愿</h1>
        <p className="text-body-sm text-body">
          重新编辑后，心愿会重新进入“待家长设置积分”状态。
        </p>
      </div>

      {wish.rejectReason ? (
        <AppCard variant="peach" className="text-body-sm text-white">
          <p className="font-bold text-white">家长驳回原因</p>
          <p className="mt-1 text-white/90">{wish.rejectReason}</p>
        </AppCard>
      ) : null}

      <AppCard>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <AppCardTitle>心愿信息</AppCardTitle>
          <label>
            心愿标题
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              placeholder="例如：周末去科技馆"
            />
          </label>
          <label>
            说明
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="可以写一写为什么想要这个心愿"
            />
          </label>
          {error ? <p className="text-body-sm text-brand-coral">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <AppButton type="submit" disabled={!title.trim() || submitting}>
              {submitting ? "保存中..." : "保存修改"}
            </AppButton>
            <AppButtonLink href="/child/wishes" variant="secondary">
              返回心愿清单
            </AppButtonLink>
          </div>
        </form>
      </AppCard>
    </div>
  );
}
