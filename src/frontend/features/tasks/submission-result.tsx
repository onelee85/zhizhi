"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ApiError, getTask } from "@/features/api/client";
import { getImageCount, statusLabel, statusTone } from "@/features/tasks/status";
import type { StudyTask } from "@/features/tasks/types";

export function SubmissionResult({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<StudyTask | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
          setError(err instanceof ApiError ? err.message : "加载提交结果失败");
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

  if (isLoading) {
    return <Card className="text-body-sm text-muted">正在加载提交结果...</Card>;
  }

  if (!task) {
    return <Card className="text-body-sm text-brand-coral">{error || "任务不存在"}</Card>;
  }

  const images = task.submission?.images ?? [];
  const submittedAt = task.submission?.submittedAt
    ? new Date(task.submission.submittedAt).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "暂无";
  const dueAt = task.dueTime ? `${task.dueDate ?? "今日"} ${task.dueTime}` : task.dueDate ?? "今日";

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="rounded-xl bg-brand-ochre p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{task.subject}</Badge>
          <Badge>{task.taskType}</Badge>
          <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
        </div>
        <h1 className="mt-4 text-display-md text-ink">{task.title}</h1>
        <p className="mt-3 max-w-3xl text-body-md text-ink/75">{task.description}</p>
      </div>

      <Card className="bg-canvas/95">
        <CardTitle>提交结果</CardTitle>
        <dl className="mt-4 grid gap-3 text-body-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">当前状态</dt>
            <dd className="font-medium text-ink">{statusLabel[task.status]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">任务类型</dt>
            <dd className="font-medium text-ink">{task.subject} · {task.taskType}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">截止时间</dt>
            <dd className="font-medium text-ink">{dueAt}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">提交时间</dt>
            <dd className="font-medium text-ink">{submittedAt}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">上传图片</dt>
            <dd className="font-medium text-ink">{getImageCount(task)} 张</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">孩子备注</dt>
            <dd className="max-w-md text-right font-medium text-ink">{task.submission?.childNote ?? task.childNote ?? "暂无"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">AI 检查</dt>
            <dd className="font-medium text-ink">{task.needAiCheck ? "等待后续接入" : "未开启"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">家长确认</dt>
            <dd className="font-medium text-ink">
              {task.status === "confirmed" ? "已确认" : task.status === "needs_resubmit" ? "需要补充" : "待家长处理"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card variant="cream">
        <CardTitle>提交图片</CardTitle>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.length > 0
            ? images.map((image, index) => (
                <a
                  key={image.id}
                  href={image.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group block"
                >
                  <img
                    src={image.imageThumbUrl ?? image.imageUrl}
                    alt={`提交图片 ${index + 1}`}
                    className="aspect-[4/3] w-full rounded-lg border border-hairline object-cover transition group-hover:opacity-90"
                  />
                </a>
              ))
            : (
                <div className="col-span-full flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-hairline bg-canvas text-caption text-muted-soft">
                  暂无图片
                </div>
              )}
        </div>
      </Card>

      <Card className="bg-canvas/95">
        <CardTitle>下一步</CardTitle>
        <p className="mt-4 rounded-lg bg-surface-soft p-4 text-body-sm text-muted">
          {task.status === "confirmed"
            ? "家长已确认通过。"
            : task.status === "needs_resubmit"
              ? "家长要求补充，请返回任务列表重新提交。"
              : "已提交成功，等待家长查看和确认。"}
        </p>
        <div className="mt-5">
          <ButtonLink href="/child" variant="secondary">
            返回今日任务
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
