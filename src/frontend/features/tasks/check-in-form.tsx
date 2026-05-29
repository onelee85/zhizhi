"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ApiError, getTask, submitTask, uploadPhoto } from "@/features/api/client";
import { statusLabel, statusTone } from "@/features/tasks/status";
import type { StudyTask } from "@/features/tasks/types";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function CheckInForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [task, setTask] = useState<StudyTask | null>(null);
  const [completed, setCompleted] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
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

    if (!completed) {
      setError("请先勾选已完成");
      return;
    }

    if (photos.length === 0) {
      setError("请至少上传 1 张图片");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedPhotos = await Promise.all(photos.map((photo) => uploadPhoto(photo)));
      await submitTask(taskId, {
        completed: true,
        imageUrls: uploadedPhotos.map((photo) => photo.url),
        childNote: childNote.trim() || undefined
      });
      router.push(`/child/tasks/${taskId}/result`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "提交打卡失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePhotoChange(files: FileList | null) {
    setError("");
    const nextPhotos = Array.from(files ?? []);

    if (nextPhotos.length > 9) {
      setPhotos([]);
      setError("最多上传 9 张图片");
      return;
    }

    const invalidType = nextPhotos.find((file) => !ALLOWED_PHOTO_TYPES.includes(file.type));
    if (invalidType) {
      setPhotos([]);
      setError("只支持 jpg、jpeg、png、webp 图片");
      return;
    }

    const oversize = nextPhotos.find((file) => file.size > MAX_PHOTO_SIZE);
    if (oversize) {
      setPhotos([]);
      setError("单张图片不能超过 5MB");
      return;
    }

    setPhotos(nextPhotos);
  }

  if (isLoading) {
    return <Card className="text-body-sm text-muted">正在加载任务...</Card>;
  }

  if (!task) {
    return <Card className="text-body-sm text-brand-coral">{error || "任务不存在"}</Card>;
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="rounded-xl bg-brand-mint p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{task.subject}</Badge>
          <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
        </div>
        <h1 className="mt-4 text-display-md text-ink">{task.title}</h1>
        <p className="mt-3 max-w-3xl text-body-md text-ink/75">{task.description}</p>
      </div>

      <Card>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <CardTitle>完成并打卡</CardTitle>
          <label className="flex items-center gap-3 rounded-lg bg-surface-soft p-4">
            <input
              className="h-4 w-4"
              type="checkbox"
              checked={completed}
              onChange={(event) => setCompleted(event.target.checked)}
            />
            我已完成
          </label>
          <label>
            上传图片
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => handlePhotoChange(event.target.files)}
            />
            <span className="mt-2 block text-caption text-muted-soft">
              支持 jpg、jpeg、png、webp，单张不超过 5MB，最多 9 张
            </span>
          </label>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {photos.map((photo) => (
                <div key={`${photo.name}-${photo.lastModified}`} className="rounded-lg border border-hairline bg-surface-soft p-3">
                  <p className="truncate text-body-sm font-medium text-ink">{photo.name}</p>
                  <p className="mt-1 text-caption text-muted-soft">{(photo.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ))}
            </div>
          ) : null}
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
              {isSubmitting ? "上传并提交中..." : "提交打卡"}
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
