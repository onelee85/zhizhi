"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ApiError, deleteTask, getTask, reviewTask } from "@/features/api/client";
import { getImageCount, statusLabel, statusTone } from "@/features/tasks/status";
import type { StudyTask } from "@/features/tasks/types";

export function ParentTaskDetail({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [task, setTask] = useState<StudyTask | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!window.confirm("确定要删除这个任务吗？")) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await deleteTask(taskId);
      router.push("/parent");
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
  const images = task.submission?.images ?? [];

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{task.subject}</Badge>
            <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
            {canEditOrDelete ? (
              <span className="ml-auto flex gap-2">
                <ButtonLink href={`/parent/tasks/${task.id}/edit`} variant="secondary">
                  编辑
                </ButtonLink>
                <Button variant="secondary" disabled={isDeleting} onClick={handleDelete}>
                  {isDeleting ? "删除中..." : "删除"}
                </Button>
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-title-lg text-ink">{task.title}</h1>
          <p className="mt-2 text-body-sm text-muted">{task.description}</p>
        </div>
        <ButtonLink href="/parent" variant="ghost">
          返回
        </ButtonLink>
      </div>

      {error ? <Card className="text-body-sm text-brand-coral">{error}</Card> : null}

      <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card>
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
              <dd className="font-medium text-ink">{task.dueTime ?? "今日"}</dd>
            </div>
          </dl>
          <div className="mt-4 grid grid-cols-3 gap-3">
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
          <p className="mt-4 text-body-sm text-muted">
            {task.aiSummary ?? "AI 检查尚未接入，当前由家长直接确认或要求补充。"}
          </p>
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
        </Card>
      </section>
    </div>
  );
}
