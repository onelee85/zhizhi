"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton, AppButtonLink } from "@/components/ui/button";
import { AppCard, AppCardTitle } from "@/components/ui/card";
import { ApiError, createWish } from "@/features/api/client";

export function ChildWishCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
      await createWish({
        title: title.trim(),
        description: description.trim() || undefined
      });
      router.push("/child/wishes");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "提交心愿失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div className="grid gap-3 rounded-[32px] bg-[#fffdf2] p-5 shadow-[0_10px_0_rgba(114,93,66,0.08)] md:p-6">
        <p className="text-caption-uppercase text-muted">New wish</p>
        <h1 className="text-display-sm tracking-normal text-ink">提交新心愿</h1>
        <p className="text-body-sm text-body">
          写下想实现的小目标，提交后由家长设置所需积分。
        </p>
      </div>

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
              {submitting ? "提交中..." : "提交心愿"}
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
