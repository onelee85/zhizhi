"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { AppConfirmModal } from "@/components/ui/modal";
import { ApiError, deleteTask, getTask, reviewTask } from "@/features/api/client";
import { ProtectedImage } from "@/features/tasks/protected-image";
import { getImageCount, getTaskStatusLabel, getTaskStatusTone } from "@/features/tasks/status";
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
    if (reviewResult === "need_resubmit" && !comment.trim()) {
      setError("要求补充时必须填写清楚的原因");
      return;
    }
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

  const canEdit = !task.isArchived && (task.status === "pending" || task.status === "needs_resubmit");
  const canDelete = !task.isArchived && task.status === "pending" && (task.submissions?.length ?? 0) === 0;
  const canReview = Boolean(task.submission) && task.status === "parent_review";
  const submissions = task.submissions ?? (task.submission ? [task.submission] : []);

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href={returnHref} variant="ghost" className="gap-1.5 px-3 text-muted hover:text-ink">
          <span aria-hidden className="text-body">←</span>
          返回
        </ButtonLink>
        {canEdit || canDelete ? (
          <span className="ml-1 flex gap-2">
            {canEdit ? (
              <ButtonLink href={`/parent/tasks/${task.id}/edit`} variant="secondary" className="px-3">
                编辑
              </ButtonLink>
            ) : null}
            {canDelete ? (
              <Button
                variant="ghost"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 text-muted-soft hover:text-brand-coral"
              >
                {isDeleting ? "删除中..." : "删除"}
              </Button>
            ) : null}
          </span>
        ) : null}
      </div>

      <div className="rounded-xl bg-surface-soft p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{task.subject}</Badge>
          <Badge tone={getTaskStatusTone(task)}>{getTaskStatusLabel(task)}</Badge>
          {task.rewardPoints !== undefined ? <Badge tone="success">+{task.rewardPoints} 积分</Badge> : null}
        </div>
        <h1 className="mt-4 text-display-md text-ink">{task.title}</h1>
        <p className="mt-3 max-w-3xl text-body-md text-body">{task.description}</p>
        {task.note ? <p className="mt-3 max-w-3xl rounded-lg bg-white/65 p-3 text-body-sm text-muted">备注：{task.note}</p> : null}
      </div>

      {error ? <Card className="text-body-sm text-brand-coral">{error}</Card> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card variant="cream">
          <CardTitle>孩子提交记录</CardTitle>
          <dl className="mt-4 grid gap-3 text-body-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">上传图片</dt>
              <dd className="font-medium text-ink">{getImageCount(task)} 张</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">孩子备注</dt>
              <dd className="font-medium text-ink">{task.submission?.childNote ?? "暂无"}</dd>
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
          <div className="mt-5 grid gap-4">
            {submissions.map((submission, submissionIndex) => (
              <div key={submission.id} className="rounded-[20px] border border-[#eadfc3] bg-[#fffdf8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body-sm font-bold text-ink">第 {submissionIndex + 1} 次提交</p>
                  <p className="text-caption text-muted-soft">
                    {new Date(submission.submittedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
                  </p>
                </div>
                <p className="mt-2 text-body-sm text-muted">孩子备注：{submission.childNote || "暂无"}</p>
                {submission.review ? (
                  <p className="mt-2 rounded-lg bg-surface-soft p-3 text-body-sm text-muted">
                    家长处理：{submission.review.reviewResult === "pass" ? "确认通过" : "要求补充"}
                    {submission.review.comment ? `，${submission.review.comment}` : ""}
                  </p>
                ) : null}
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {submission.images.map((image, imageIndex) => (
                    <ProtectedImage
                      key={image.id}
                      src={image.imageThumbUrl ?? image.imageUrl}
                      alt={`第 ${submissionIndex + 1} 次提交图片 ${imageIndex + 1}`}
                      link
                      className="aspect-[4/3] w-full rounded-lg border border-hairline object-cover"
                    />
                  ))}
                  {submission.images.length === 0 ? (
                    <div className="col-span-full rounded-lg border border-dashed border-hairline bg-surface-soft p-4 text-center text-caption text-muted-soft">
                      本次提交无需图片
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {submissions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-hairline bg-surface-soft p-4 text-center text-caption text-muted-soft">
                暂无提交
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardTitle>家长审核</CardTitle>
          <p className="mt-4 rounded-lg bg-surface-soft p-4 text-body-sm text-muted">
            请根据孩子最新一次提交的照片和备注进行确认。
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
            <div className="mt-5 grid gap-3">
              <p className="rounded-lg bg-surface-soft p-4 text-body-sm text-muted">
                {task.status === "confirmed"
                  ? "该任务已确认通过。"
                  : task.status === "needs_resubmit"
                    ? "已要求孩子补充提交，等待新的打卡内容。"
                    : "孩子提交打卡后，可在这里确认通过或要求补充。"}
              </p>
              {task.latestReview?.comment ? (
                <p className="rounded-lg border border-[#eadfc3] bg-[#fffdf8] p-4 text-body-sm text-[#725d42]">
                  最近审核备注：{task.latestReview.comment}
                </p>
              ) : null}
            </div>
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
