"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { ApiError, deleteTask, getParentDashboard } from "@/features/api/client";
import { getImageCount, statusLabel, statusTone } from "@/features/tasks/status";
import type { ParentDashboard, StudyTask } from "@/features/tasks/types";

export function ParentDashboardView() {
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const dashboardData = await getParentDashboard();
        if (!active) {
          return;
        }
        setDashboard(dashboardData);
        setTasks(dashboardData.tasks);
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "加载今日看板失败");
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

  async function handleDelete(event: React.MouseEvent, taskId: string) {
    event.preventDefault();
    event.stopPropagation();

    if (!window.confirm("确定要删除这个任务吗？")) {
      return;
    }

    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除任务失败");
    }
  }

  const total = dashboard?.summary.total ?? tasks.length;
  const done = dashboard?.summary.confirmed ?? tasks.filter((task) => task.status === "confirmed").length;
  const needsResubmit =
    dashboard?.summary.needsResubmit ?? tasks.filter((task) => task.status === "needs_resubmit").length;
  const waitingReview =
    dashboard?.summary.waitingReview ?? tasks.filter((task) => task.status === "parent_review").length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-title-lg text-ink">今日看板</h1>
          <p className="mt-2 text-body-sm text-muted">
            从后端加载家庭任务进度
          </p>
        </div>
        <ButtonLink href="/parent/tasks/new">创建任务</ButtonLink>
      </div>

      {error ? <Card className="text-body-sm text-brand-coral">{error}</Card> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Card variant="cream">
          <p className="text-caption text-muted">今日任务</p>
          <p className="mt-2 text-display-sm text-ink">{isLoading ? "-" : total}</p>
        </Card>
        <Card variant="cream">
          <p className="text-caption text-muted">已确认</p>
          <p className="mt-2 text-display-sm text-ink">{isLoading ? "-" : done}</p>
        </Card>
        <Card variant="cream">
          <p className="text-caption text-muted">待确认</p>
          <p className="mt-2 text-display-sm text-ink">{isLoading ? "-" : waitingReview}</p>
        </Card>
        <Card variant="cream">
          <p className="text-caption text-muted">需补充</p>
          <p className="mt-2 text-display-sm text-ink">{isLoading ? "-" : needsResubmit}</p>
        </Card>
      </section>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-4">
          <CardTitle>任务列表</CardTitle>
          <span className="text-caption text-muted-soft">后端实时数据</span>
        </div>
        <div className="divide-y divide-hairline">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/parent/tasks/${task.id}`}
              className="grid gap-3 py-4 transition-colors hover:bg-surface-soft/50 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{task.subject}</Badge>
                  <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
                  {getImageCount(task) > 0 ? <Badge tone="lavender">{getImageCount(task)} 张图</Badge> : null}
                </div>
                <h2 className="mt-2 text-title-sm text-ink">{task.title}</h2>
                <p className="mt-1 text-body-sm text-muted">{task.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-body-sm text-muted-soft">
                  截止 {task.dueTime ? task.dueTime : task.dueDate ?? "今日"}
                </span>
                {task.status === "pending" || task.status === "needs_resubmit" ? (
                  <Button
                    variant="ghost"
                    className="text-caption text-muted-soft hover:text-brand-coral"
                    onClick={(event) => void handleDelete(event, task.id)}
                  >
                    删除
                  </Button>
                ) : null}
              </div>
            </Link>
          ))}
          {!isLoading && tasks.length === 0 ? (
            <p className="py-6 text-body-sm text-muted">还没有创建任务。</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
