"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { AppConfirmModal } from "@/components/ui/modal";
import { ApiError, deleteTask, getTask, reviewTask } from "@/features/api/client";
import { getImageCount, statusLabel, statusTone } from "@/features/tasks/status";
import type { StudyTask } from "@/features/tasks/types";

export function ParentTaskDetail({ taskId, returnHref = "/parent" }: { taskId: string; returnHref?: string }) {
  const router = useRouter();
  const [task, setTask] = useState<StudyTask | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getTask(taskId);
        if (active) {
          setTask(result.task);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "加载任务详情失败");
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
  }, [taskId]);

  async function handleReview(reviewResult: "pass" | "need_resubmit") {
    setError("");
    setIsSubmitting(true);

    try {
      const result = await reviewTask(taskId, {
        reviewResult,
        comment: comment.trim() || undefined
      });
      setTask(result.task);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "审核失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setError("");
    setIsDeleting(true);

    try {
      await deleteTask(taskId);
      router.push(returnHref);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除任务失败");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <Card className="text-body-sm text-muted">正在加载任务详情...</Card>;
  }

  if (!task) {
    return <Card className="text-body-sm text-brand-coral">{error || "任务不存在"}</Card>;
  }

  const canEditOrDelete = task.status === "pending" || task.status === "needs_resubmit";
  const canReview =
    Boolean(task.submission) && ["submitted", "ai_checking", "parent_review"].includes(task.status);
  const images = task.submission?.images ?? [];

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href={returnHref} variant="ghost" className="gap-1.5 px-3 text-muted hover:text-ink">
          <span aria-hidden className="text-body">←</span>
          返回
        </ButtonLink>
        {canEditOrDelete ? (
          <span className="ml-1 flex gap-2">
            <ButtonLink href={`/parent/tasks/${task.id}/edit`} variant="secondary" className="px-3">
              编辑
            </ButtonLink>
            <Button
              variant="ghost"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3 text-muted-soft hover:text-brand-coral"
            >
              {isDeleting ? "删除中..." : "删除"}
            </Button>
          </span>
        ) : null}
      </div>

      <div className="rounded-xl bg-surface-soft p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{task.subject}</Badge>
          <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
          {task.rewardPoints ? <Badge tone="success">+{task.rewardPoints} 积分</Badge> : null}
        </div>
        <h1 className="mt-4 text-display-md text-ink">{task.title}</h1>
        <p className="mt-3 max-w-3xl text-body-md text-body">{task.description}</p>
      </div>

      {error ? <Card className="text-body-sm text-brand-coral">{error}</Card> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card variant="cream">
          <CardTitle>孩子提交</CardTitle>
          <dl className="mt-4 grid gap-3 text-body-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">上传图片</dt>
              <dd className="font-medium text-ink">{getImageCount(task)} 张</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">孩子备注</dt>
              <dd className="font-medium text-ink">{task.submission?.childNote ?? task.childNote ?? "暂无"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">截止时间</dt>
              <dd className="font-medium text-ink">{task.dueTime ? task.dueTime : task.dueDate ?? "今日"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">奖励积分</dt>
              <dd className="font-medium text-ink">{task.rewardPoints ?? 0}</dd>
            </div>
          </dl>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {images.length > 0
              ? images.map((image) => (
                  <a key={image.id} href={image.imageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={image.imageThumbUrl ?? image.imageUrl}
                      alt="提交图片"
                      className="aspect-[4/3] w-full rounded-lg border border-hairline object-cover"
                    />
                  </a>
                ))
              : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-hairline bg-surface-soft text-caption text-muted-soft">
                    暂无图片
                  </div>
                )}
          </div>
        </Card>

        <Card>
          <CardTitle>家长审核</CardTitle>
          <p className="mt-4 rounded-lg bg-surface-soft p-4 text-body-sm text-muted">
            {task.aiSummary ?? "AI 检查尚未接入，当前由家长直接确认或要求补充。"}
          </p>
          {canReview ? (
            <form className="mt-5 grid gap-4">
              <label>
                审核备注
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="例如：完成得很好，或说明需要补充的原因"
                  rows={4}
                  maxLength={500}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleReview("pass")}
                >
                  确认通过
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => void handleReview("need_resubmit")}
                >
                  要求补充
                </Button>
              </div>
            </form>
          ) : (
            <p className="mt-5 rounded-lg bg-surface-soft p-4 text-body-sm text-muted">
              {task.status === "confirmed"
                ? "该任务已确认通过。"
                : task.status === "needs_resubmit"
                  ? "已要求孩子补充提交，等待新的打卡内容。"
                  : "孩子提交打卡后，可在这里确认通过或要求补充。"}
            </p>
          )}
        </Card>
      </section>
      <AppConfirmModal
        open={isDeleteModalOpen}
        title="删除任务"
        description="确定要删除这个任务吗？删除后孩子端将不再看到它。"
        detail={`任务：${task.title}`}
        confirmText="删除"
        loading={isDeleting}
        tone="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
