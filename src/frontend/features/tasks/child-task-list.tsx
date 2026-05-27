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
    <div className="grid gap-6">
      <div>
        <h1 className="text-title-lg text-ink">今日任务</h1>
        <p className="mt-2 text-body-sm text-muted">从后端读取今天需要完成的学习任务。</p>
      </div>

      {error ? <Card className="text-body-sm text-brand-coral">{error}</Card> : null}

      <Card>
        <CardTitle>任务清单</CardTitle>
        <div className="mt-4 divide-y divide-hairline">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/child/tasks/${task.id}/check-in`}
              className="grid gap-3 py-4 transition-colors hover:bg-surface-soft/50 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{task.subject}</Badge>
                  <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
                </div>
                <h2 className="mt-2 text-title-sm text-ink">{task.title}</h2>
                <p className="mt-1 text-body-sm text-muted">{task.description}</p>
              </div>
              <div className="text-body-sm text-muted-soft">
                {task.status === "confirmed" ? "查看结果" : "去打卡"}
              </div>
            </Link>
          ))}
          {isLoading ? <p className="py-6 text-body-sm text-muted">正在加载...</p> : null}
          {!isLoading && tasks.length === 0 ? (
            <p className="py-6 text-body-sm text-muted">今天还没有任务。</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
