"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ApiError, createTask, updateTask } from "@/features/api/client";
import type { Subject, StudyTask, TaskType } from "@/features/tasks/types";

const subjects: Subject[] = ["语文", "数学", "英语", "其他"];
const taskTypes: TaskType[] = ["作业", "预习", "复习", "错题", "阅读", "背诵", "练习"];
const demoChildren = [{ id: "child-1", nickname: "孩子 Demo" }];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function TaskForm({ task }: { task?: StudyTask }) {
  const router = useRouter();
  const isEdit = Boolean(task);
  const [childUserId, setChildUserId] = useState(task?.childUserId ?? demoChildren[0].id);
  const [subject, setSubject] = useState<Subject>(task?.subject ?? "数学");
  const [taskType, setTaskType] = useState<TaskType>(task?.taskType ?? "练习");
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? today());
  const [dueTime, setDueTime] = useState(task?.dueTime ?? "20:30");
  const [needPhoto, setNeedPhoto] = useState(task?.needPhoto ?? true);
  const [needAiCheck, setNeedAiCheck] = useState(task?.needAiCheck ?? false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(childUserId && title.trim() && description.trim() && dueDate),
    [childUserId, description, dueDate, title]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isEdit && task) {
        const result = await updateTask(task.id, {
          subject,
          taskType,
          title: title.trim(),
          description: description.trim(),
          dueDate,
          dueTime: dueTime || undefined,
          needPhoto,
          needAiCheck
        });
        router.push(`/parent/tasks/${result.task.id}`);
      } else {
        const result = await createTask({
          childUserId,
          subject,
          taskType,
          title: title.trim(),
          description: description.trim(),
          dueDate,
          dueTime: dueTime || undefined,
          needPhoto,
          needAiCheck
        });
        router.push(`/parent/tasks/${result.task.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isEdit ? "更新任务失败" : "创建任务失败"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <ButtonLink
        href={isEdit && task ? `/parent/tasks/${task.id}` : "/parent"}
        variant="ghost"
        className="gap-1.5 -ml-2 px-3 text-muted hover:text-ink"
      >
        <span aria-hidden className="text-body">←</span>
        返回
      </ButtonLink>

      <div className="rounded-xl bg-brand-peach p-6 md:p-8">
        <p className="text-caption-uppercase text-ink/65">Task editor</p>
        <h1 className="mt-3 text-display-md text-ink">{isEdit ? "编辑学习任务" : "创建学习任务"}</h1>
        <p className="mt-3 max-w-2xl text-body-md text-ink/75">
          {isEdit ? "修改任务信息后保存。" : "保存后会写入后端任务接口。"}
        </p>
      </div>

      <Card>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <CardTitle>任务信息</CardTitle>
          {!isEdit && (
            <label>
              孩子
              <select value={childUserId} onChange={(event) => setChildUserId(event.target.value)}>
                {demoChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.nickname}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            科目
            <select value={subject} onChange={(event) => setSubject(event.target.value as Subject)}>
              {subjects.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            任务类型
            <select value={taskType} onChange={(event) => setTaskType(event.target.value as TaskType)}>
              {taskTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            任务标题
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} />
          </label>
          <label>
            任务说明
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={1000}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              截止日期
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </label>
            <label>
              截止时间
              <input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 rounded-lg bg-surface-soft p-4 text-body-sm text-muted">
            <label className="flex items-center gap-3">
              <input
                className="h-4 w-4"
                type="checkbox"
                checked={needPhoto}
                onChange={(event) => setNeedPhoto(event.target.checked)}
              />
              需要拍照
            </label>
            <label className="flex items-center gap-3">
              <input
                className="h-4 w-4"
                type="checkbox"
                checked={needAiCheck}
                onChange={(event) => setNeedAiCheck(event.target.checked)}
              />
              开启 AI 检查
            </label>
          </div>
          {error ? <p className="text-body-sm text-brand-coral">{error}</p> : null}
          <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-fit">
            {isSubmitting ? "保存中..." : (isEdit ? "保存修改" : "保存并发布")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
