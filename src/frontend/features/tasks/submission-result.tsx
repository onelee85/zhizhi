"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AppButton, AppButtonLink } from "@/components/ui/button";
import { AppCard, AppCardTitle } from "@/components/ui/card";
import { AppModal } from "@/components/ui/modal";
import { ApiError, getTask } from "@/features/api/client";
import { toCurrentOriginUrl } from "@/features/tasks/media-url";
import { getImageCount, statusLabel, statusTone } from "@/features/tasks/status";
import type { StudyTask } from "@/features/tasks/types";

export function SubmissionResult({
  taskId,
  returnHref = "/child",
  returnLabel = "返回任务清单"
}: {
  taskId: string;
  returnHref?: string;
  returnLabel?: string;
}) {
  const [task, setTask] = useState<StudyTask | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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
    return <AppCard className="mx-auto max-w-lg text-body-sm text-muted">正在加载提交结果...</AppCard>;
  }

  if (!task) {
    return <AppCard className="mx-auto max-w-lg text-body-sm text-brand-coral">{error || "任务不存在"}</AppCard>;
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
  const aiResultText = task.aiSummary ?? (task.needAiCheck ? "AI 检查还在等待接入或处理中，家长仍可继续查看提交内容。" : "这个任务未开启 AI 检查。");

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div className="flex">
        <AppButtonLink href={returnHref} variant="ghost" className="gap-1.5 px-3 text-muted hover:text-ink">
          <span aria-hidden className="text-body">←</span>
          {returnLabel}
        </AppButtonLink>
      </div>

      <div className="rounded-[32px] bg-[#f7cd67] p-5 text-[#725d42] shadow-[0_10px_0_rgba(114,93,66,0.08)] md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{task.subject}</Badge>
          <Badge>{task.taskType}</Badge>
          <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
        </div>
        <p className="mt-4 text-caption font-bold uppercase text-[#725d42]/70">Mission report</p>
        <h1 className="mt-2 text-display-sm tracking-normal text-ink">{task.title}</h1>
        <p className="mt-3 text-body-sm text-[#725d42]/80">{task.description}</p>
      </div>

      <AppCard className="bg-canvas/95">
        <AppCardTitle>提交结果</AppCardTitle>
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
            <dd className="font-medium text-ink">{task.needAiCheck ? (task.aiSummary ? "已生成" : "处理中") : "未开启"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">家长确认</dt>
            <dd className="font-medium text-ink">
              {task.status === "confirmed" ? "已确认" : task.status === "needs_resubmit" ? "需要补充" : "待家长处理"}
            </dd>
          </div>
        </dl>
        <div className="mt-5">
          <AppButton type="button" variant="secondary" onClick={() => setIsAiModalOpen(true)}>
            查看 AI 检查结果
          </AppButton>
        </div>
      </AppCard>

      <AppCard variant="cream">
        <AppCardTitle>提交图片</AppCardTitle>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
          {images.length > 0
            ? images.map((image, index) => {
                const imageUrl = toCurrentOriginUrl(image.imageUrl);
                const thumbUrl = toCurrentOriginUrl(image.imageThumbUrl ?? image.imageUrl);

                return (
                  <a
                    key={image.id}
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group block"
                  >
                    <img
                      src={thumbUrl}
                      alt={`提交图片 ${index + 1}`}
                      className="aspect-[4/3] w-full rounded-[18px] border-2 border-[#eadfc3] object-cover transition group-hover:opacity-90"
                    />
                  </a>
                );
              })
            : (
                <div className="col-span-full flex aspect-[4/3] items-center justify-center rounded-[22px] border-2 border-dashed border-[#eadfc3] bg-canvas text-caption text-muted-soft">
                  暂无图片
                </div>
              )}
        </div>
      </AppCard>

      <AppCard className="bg-canvas/95">
        <AppCardTitle>下一步</AppCardTitle>
        <p className="mt-4 rounded-[22px] bg-[#f7f0d8] p-4 text-body-sm text-muted">
          {task.status === "confirmed"
            ? "家长已确认通过。"
            : task.status === "needs_resubmit"
              ? `家长要求补充，请${returnLabel}重新提交。`
              : "已提交成功，等待家长查看和确认。"}
        </p>
      </AppCard>

      <AppModal
        open={isAiModalOpen}
        title="AI 检查结果"
        onClose={() => setIsAiModalOpen(false)}
        footer={
          <AppButton type="button" onClick={() => setIsAiModalOpen(false)}>
            知道了
          </AppButton>
        }
      >
        <div className="grid gap-3 text-body-sm text-[#725d42]">
          <p className="rounded-[20px] bg-[#fffdf2] p-4">{aiResultText}</p>
          <p className="text-caption text-muted">
            最终确认仍由家长处理，AI 结果仅作为辅助信息。
          </p>
        </div>
      </AppModal>
    </div>
  );
}
