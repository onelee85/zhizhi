"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { AppButton, AppButtonLink } from "@/components/ui/button";
import { AppCard, AppCardTitle } from "@/components/ui/card";
import { ApiError, getTask, submitTask, uploadPhoto } from "@/features/api/client";
import { getTaskStatusLabel, getTaskStatusTone } from "@/features/tasks/status";
import type { StudyTask } from "@/features/tasks/types";
import { getBusinessDate } from "@/lib/business-date";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

type PhotoUploadState = {
  status: "uploading" | "uploaded" | "error";
  url?: string;
  error?: string;
};

export function CheckInForm({
  taskId,
  returnHref = "/child",
  returnLabel = "返回任务清单"
}: {
  taskId: string;
  returnHref?: string;
  returnLabel?: string;
}) {
  const router = useRouter();
  const [task, setTask] = useState<StudyTask | null>(null);
  const [completed, setCompleted] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoUploadStates, setPhotoUploadStates] = useState<Record<string, PhotoUploadState>>({});
  const [childNote, setChildNote] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultHref = returnHref === "/child/calendar"
    ? `/child/tasks/${taskId}/result?from=calendar`
    : `/child/tasks/${taskId}/result`;

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

  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!task) {
      setError("任务不存在");
      return;
    }

    if (!completed) {
      setError("请先勾选已完成");
      return;
    }

    if (task.needPhoto && photos.length === 0) {
      setError("请至少上传 1 张图片");
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedPhotos = await Promise.all(
        photos.map((photo, index) => uploadSelectedPhoto(photo, index))
      );
      if (uploadedPhotos.some((url) => !url)) {
        setError("部分图片上传失败，请在对应图片上重试后再次提交");
        return;
      }
      await submitTask(taskId, {
        completed: true,
        imageUrls: uploadedPhotos as string[],
        childNote: childNote.trim() || undefined
      });
      router.push(resultHref);
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
    setPhotoUploadStates({});
  }

  async function uploadSelectedPhoto(photo: File, index: number) {
    const key = getPhotoKey(photo, index);
    const existing = photoUploadStates[key];
    if (existing?.status === "uploaded" && existing.url) {
      return existing.url;
    }

    setPhotoUploadStates((prev) => ({
      ...prev,
      [key]: { status: "uploading" }
    }));

    try {
      const uploaded = await uploadPhoto(photo);
      setPhotoUploadStates((prev) => ({
        ...prev,
        [key]: { status: "uploaded", url: uploaded.url }
      }));
      return uploaded.url;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "上传失败";
      setPhotoUploadStates((prev) => ({
        ...prev,
        [key]: { status: "error", error: message }
      }));
      return null;
    }
  }

  if (isLoading) {
    return <AppCard className="mx-auto max-w-lg text-body-sm text-muted">正在加载任务...</AppCard>;
  }

  if (!task) {
    return <AppCard className="mx-auto max-w-lg text-body-sm text-brand-coral">{error || "任务不存在"}</AppCard>;
  }

  const isFutureTask = isFutureDueDate(task.dueDate);

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div className="flex">
        <AppButtonLink href={returnHref} variant="ghost" className="gap-1.5 px-3 text-muted hover:text-ink">
          <span aria-hidden className="text-body">←</span>
          {returnLabel}
        </AppButtonLink>
      </div>

      <div className="rounded-[32px] bg-[#82d5bb] p-5 text-white shadow-[0_10px_0_rgba(114,93,66,0.08)] md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{task.subject}</Badge>
          <Badge tone={getTaskStatusTone(task)}>{getTaskStatusLabel(task)}</Badge>
        </div>
        <p className="mt-4 text-caption font-bold uppercase text-white/75">Mission check-in</p>
        <h1 className="mt-2 text-display-sm tracking-normal text-white">{task.title}</h1>
        <p className="mt-3 text-body-sm text-white/85">{task.description}</p>
        {task.note ? <p className="mt-3 rounded-[18px] bg-white/15 p-3 text-body-sm text-white">{task.note}</p> : null}
      </div>

      {isFutureTask ? (
        <AppCard className="grid gap-3">
          <AppCardTitle>先看看任务内容</AppCardTitle>
          <p className="text-body-sm text-muted">
            这个任务安排在 {formatDateTitle(task.dueDate)}，时间还没到哦。可以先了解要做什么，等到当天再来打卡提交。
          </p>
          <div className="rounded-[22px] bg-[#f7f0d8] p-4 text-body-sm text-[#725d42]">
            {task.dueTime ? `当天 ${task.dueTime} 前完成。` : "到任务当天就可以提交打卡。"}
          </div>
        </AppCard>
      ) : (
        <AppCard>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <AppCardTitle>完成并打卡</AppCardTitle>
            <label className="flex items-center gap-3 rounded-[22px] bg-[#f7f0d8] p-4">
              <input
                className="h-4 w-4"
                type="checkbox"
                checked={completed}
                onChange={(event) => setCompleted(event.target.checked)}
              />
              我已完成
            </label>
            {task.needPhoto ? (
              <>
                <label>
                  上传图片
                  <input
                    className="cursor-pointer"
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
                    {photos.map((photo, index) => (
                      <PhotoPreview
                        key={getPhotoKey(photo, index)}
                        photo={photo}
                        previewUrl={photoPreviews[index]}
                        index={index}
                        uploadState={photoUploadStates[getPhotoKey(photo, index)]}
                        onRetry={() => void uploadSelectedPhoto(photo, index)}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="rounded-[22px] bg-[#f7f0d8] p-4 text-body-sm text-muted">
                这个任务不需要上传图片，提交后直接进入家长审核。
              </p>
            )}
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
              <AppButton type="submit" loading={isSubmitting} disabled={isSubmitting}>
                {isSubmitting ? "上传并提交中..." : "提交打卡"}
              </AppButton>
              {task.submission ? (
                <AppButtonLink href={resultHref} variant="secondary">
                  查看提交结果
                </AppButtonLink>
              ) : null}
            </div>
          </form>
        </AppCard>
      )}
    </div>
  );
}

function PhotoPreview({
  photo,
  previewUrl,
  index,
  uploadState,
  onRetry
}: {
  photo: File;
  previewUrl?: string;
  index: number;
  uploadState?: PhotoUploadState;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[20px] border-2 border-[#eadfc3] bg-[#fffdf8] p-3">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={`待上传图片 ${index + 1}`}
          className="mb-2 aspect-[4/3] w-full rounded-[14px] object-cover"
        />
      ) : null}
      <p className="truncate text-body-sm font-medium text-ink">{photo.name}</p>
      <p className="mt-1 text-caption text-muted-soft">{(photo.size / 1024 / 1024).toFixed(2)} MB</p>
      {uploadState?.status === "uploading" ? (
        <p className="mt-2 text-caption text-muted">上传中...</p>
      ) : null}
      {uploadState?.status === "uploaded" ? (
        <p className="mt-2 text-caption text-[#3a8f77]">上传成功</p>
      ) : null}
      {uploadState?.status === "error" ? (
        <div className="mt-2 grid gap-2">
          <p className="text-caption text-brand-coral">{uploadState.error}</p>
          <AppButton type="button" size="small" variant="secondary" onClick={onRetry}>
            重试这张
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}

function getPhotoKey(photo: File, index: number) {
  return `${index}:${photo.name}:${photo.size}:${photo.lastModified}`;
}

function isFutureDueDate(dueDate?: string) {
  return Boolean(dueDate && dueDate > getBusinessDate());
}

function formatDateTitle(date?: string) {
  if (!date) {
    return "之后";
  }

  const [year, month, day] = date.split("-");
  return `${year} 年 ${Number.parseInt(month, 10)} 月 ${Number.parseInt(day, 10)} 日`;
}
