"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ApiError, getTask, submitTask } from "@/features/api/client";
import { statusLabel, statusTone } from "@/features/tasks/status";
import type { StudyTask } from "@/features/tasks/types";

export function CheckInForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [task, setTask] = useState<StudyTask | null>(null);
  const [completed, setCompleted] = useState(false);
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [childNote, setChildNote] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          setError(err instanceof ApiError ? err.message : "加载任务失败");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const imageUrls = imageUrlsText
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!completed) {
      setError("请先勾选已完成");
      return;
    }

    if (imageUrls.length === 0) {
      setError("请至少填写 1 个图片 URL");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitTask(taskId, {
        completed: true,
        imageUrls,
        childNote: childNote.trim() || undefined
      });
      router.push(`/child/tasks/${taskId}/result`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "提交打卡失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <Card className="text-body-sm text-muted">正在加载任务...</Card>;
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
        <h1 className="mt-3 text-title-lg text-ink">{task.title}</h1>
        <p className="mt-2 text-body-sm text-muted">{task.description}</p>
      </div>

      <Card>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <CardTitle>完成并打卡</CardTitle>
          <label className="flex items-center gap-2">
            <input
              className="h-4 w-4"
              type="checkbox"
              checked={completed}
              onChange={(event) => setCompleted(event.target.checked)}
            />
            我已完成
          </label>
          <label>
            图片 URL
            <textarea
              value={imageUrlsText}
              onChange={(event) => setImageUrlsText(event.target.value)}
              placeholder="每行一个图片 URL，Qiniu 接入前用于联调提交接口"
              rows={4}
            />
          </label>
          <label>
            孩子备注
            <textarea
              value={childNote}
              onChange={(event) => setChildNote(event.target.value)}
              placeholder="例如：第 5 题不会"
              rows={4}
              maxLength={500}
            />
          </label>
          {error ? <p className="text-body-sm text-brand-coral">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "提交打卡"}
            </Button>
            <ButtonLink href={`/child/tasks/${task.id}/result`} variant="secondary">
              查看提交结果
            </ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  );
}
