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

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{task.subject}</Badge>
          <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
        </div>
        <h1 className="mt-3 text-title-lg text-ink">提交结果</h1>
        <p className="mt-2 text-body-sm text-muted">当前任务提交和家长确认状态。</p>
      </div>

      <Card>
        <CardTitle>{task.title}</CardTitle>
        <dl className="mt-4 grid gap-3 text-body-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">当前状态</dt>
            <dd className="font-medium text-ink">{statusLabel[task.status]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">上传图片</dt>
            <dd className="font-medium text-ink">{getImageCount(task)} 张</dd>
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
        <div className="mt-5">
          <ButtonLink href="/child" variant="secondary">
            返回今日任务
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
