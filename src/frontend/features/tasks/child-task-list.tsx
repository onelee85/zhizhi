"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { ApiError, getTodayTasks } from "@/features/api/client";
import { statusLabel, statusTone } from "@/features/tasks/status";
import type { StudyTask } from "@/features/tasks/types";

export function ChildTaskList() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getTodayTasks();
        if (active) {
          setTasks(result.tasks);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "加载今日任务失败");
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
  }, []);

  return (
    <div className="grid gap-8">
      <div className="grid gap-5 rounded-xl bg-brand-lavender p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
        <div>
          <p className="text-caption-uppercase text-ink/65">Child workspace</p>
          <h1 className="mt-3 text-display-md text-ink">今日任务</h1>
          <p className="mt-3 max-w-2xl text-body-md text-ink/75">
            从后端读取今天需要完成的学习任务，完成后进入打卡页面提交图片和备注。
          </p>
        </div>
        <div className="rounded-lg bg-canvas/75 p-4 text-right">
          <p className="text-caption text-muted">任务数</p>
          <p className="mt-1 text-display-sm text-ink">{isLoading ? "-" : tasks.length}</p>
        </div>
      </div>

      {error ? <Card className="text-body-sm text-brand-coral">{error}</Card> : null}

      <Card className="overflow-hidden p-0 md:p-0">
        <div className="px-6 pt-6 md:px-8 md:pt-8">
          <CardTitle>任务清单</CardTitle>
          <p className="mt-2 text-body-sm text-muted">点击任务进入打卡。</p>
        </div>
        <div className="mt-4 divide-y divide-hairline">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/child/tasks/${task.id}/check-in`}
              className="grid gap-4 px-6 py-5 transition-colors hover:bg-surface-soft/70 md:grid-cols-[1fr_auto] md:px-8"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{task.subject}</Badge>
                  <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
                </div>
                <h2 className="mt-3 text-title-md text-ink">{task.title}</h2>
                <p className="mt-1 max-w-3xl text-body-sm text-muted">{task.description}</p>
              </div>
              <div className="flex items-center text-body-sm font-medium text-ink md:justify-end">
                {task.status === "confirmed" ? "查看结果" : "去打卡"}
              </div>
            </Link>
          ))}
          {isLoading ? <p className="px-6 py-6 text-body-sm text-muted md:px-8">正在加载...</p> : null}
          {!isLoading && tasks.length === 0 ? (
            <p className="px-6 py-6 text-body-sm text-muted md:px-8">今天还没有任务。</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
