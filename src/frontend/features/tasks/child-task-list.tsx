"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AppButtonLink } from "@/components/ui/button";
import { AppCard, AppCardTitle } from "@/components/ui/card";
import { AppTabs } from "@/components/ui/tabs";
import { ApiError, getTodayTasks } from "@/features/api/client";
import { getTaskStatusLabel, getTaskStatusTone } from "@/features/tasks/status";
import type { StudyTask } from "@/features/tasks/types";
import { getBusinessDate } from "@/lib/business-date";

type TaskView = "today" | "overdue" | "done";

const viewMeta: Record<TaskView, { title: string; description: string; empty: string }> = {
  today: {
    title: "今日任务",
    description: "今天要完成的任务，选一项开始行动吧。",
    empty: "今天还没有待完成任务。"
  },
  overdue: {
    title: "逾期任务",
    description: "这些任务已经超过截止时间，完成后记得及时打卡。",
    empty: "没有需要补做的逾期任务。"
  },
  done: {
    title: "已完成",
    description: "已经提交过的任务，可以回看打卡结果。",
    empty: "还没有已完成的任务。"
  }
};

export function ChildTaskList() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [activeView, setActiveView] = useState<TaskView>("today");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const result = await getTodayTasks({ includeOverdueIncomplete: true, includeCompleted: true });
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

  const todayIncompleteCount = tasks.filter(isTodayIncomplete).length;
  const overdueIncompleteCount = tasks.filter(isOverdueIncomplete).length;
  const completedCount = tasks.filter(isChildCompleted).length;
  const visibleTasks = tasks.filter((task) => {
    if (activeView === "today") {
      return isTodayIncomplete(task);
    }

    if (activeView === "overdue") {
      return isOverdueIncomplete(task);
    }

    return isChildCompleted(task);
  });
  const activeMeta = viewMeta[activeView];

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <div className="relative overflow-hidden rounded-[32px] bg-[#fffdf2] p-5 shadow-[0_10px_0_rgba(114,93,66,0.08)] md:p-6">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#f7cd67]/35" />
        <div className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-[#82d5bb]/30" />
        <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-caption-uppercase text-muted">Island mission</p>
            <h1 className="mt-3 text-display-sm tracking-normal text-ink">今日岛屿任务</h1>
            <p className="mt-3 text-body-sm text-body">
              选一个任务出发，完成后上传照片，让家长看到你的进度。
            </p>
          </div>
          <div className="grid gap-2">
            <div className="rounded-[24px] bg-[#f7cd67] px-5 py-4 text-center text-[#725d42] shadow-[inset_0_-5px_0_rgba(114,93,66,0.12)]">
              <p className="text-caption font-semibold">任务数</p>
              <p className="mt-1 text-display-sm tracking-normal">{isLoading ? "-" : visibleTasks.length}</p>
            </div>
            <AppButtonLink href="/child/calendar" variant="secondary" className="w-full">
              任务日历
            </AppButtonLink>
            <AppButtonLink href="/child/history" variant="secondary" className="w-full">
              历史任务
            </AppButtonLink>
            <AppButtonLink href="/child/wishes" variant="secondary" className="w-full">
              我的心愿
            </AppButtonLink>
          </div>
        </div>
      </div>

      {error ? <AppCard className="text-body-sm text-brand-coral">{error}</AppCard> : null}

      <AppCard className="overflow-hidden p-0 md:p-0">
        <div className="border-b-2 border-[#eadfc3] bg-[#fffaf0] px-4 pb-4 pt-5 md:px-5 md:pt-6">
          <div className="mb-4 flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-caption font-bold text-[#725d42]/60">我的任务</p>
              <AppCardTitle className="mt-1">{activeMeta.title}</AppCardTitle>
            </div>
            <span className="inline-flex min-w-12 items-center justify-center rounded-full bg-[#f7f0d8] px-3 py-2 text-caption font-bold text-[#725d42]">
              {isLoading ? "-" : `${visibleTasks.length} 项`}
            </span>
          </div>
          <AppTabs
            className="child-task-filter-tabs"
            activeKey={activeView}
            onChange={(key) => {
              setActiveView(key as TaskView);
            }}
            items={[
              { key: "today", label: `今日 ${todayIncompleteCount}`, children: null },
              { key: "overdue", label: `逾期 ${overdueIncompleteCount}`, children: null },
              { key: "done", label: `已完成 ${completedCount}`, children: null }
            ]}
          />
          <p className="mt-3 px-1 text-body-sm text-muted">{activeMeta.description}</p>
        </div>
        <div className="grid gap-3 bg-[#fffdf8] px-4 py-4 md:px-5 md:py-5">
          {visibleTasks.map((task, index) => (
            <Link
              key={task.id}
              href={isChildResultTask(task) ? `/child/tasks/${task.id}/result` : `/child/tasks/${task.id}/check-in`}
              className="group grid gap-4 rounded-[24px] border-2 border-[#eadfc3] bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-[#82d5bb] hover:shadow-[0_6px_0_rgba(114,93,66,0.08)]"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#82d5bb] font-black text-white shadow-[inset_0_-4px_0_rgba(68,129,111,0.35)]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{task.subject}</Badge>
                    <Badge tone={getTaskStatusTone(task)}>{getTaskStatusLabel(task)}</Badge>
                    {isOverdueIncomplete(task) ? <Badge tone="danger">逾期未完成</Badge> : null}
                    {task.rewardPoints !== undefined ? <Badge tone="success">+{task.rewardPoints} 积分</Badge> : null}
                  </div>
                  <h2 className="mt-3 text-title-md text-ink">{task.title}</h2>
                  <p className="mt-1 line-clamp-2 text-body-sm text-muted">{task.description}</p>
                  {task.note ? <p className="mt-2 line-clamp-1 text-caption text-muted-soft">备注：{task.note}</p> : null}
                </div>
              </div>
              <div className="flex min-h-10 items-center justify-between gap-3 border-t border-[#eadfc3] pt-3 text-caption">
                <span className="text-muted">截止 {formatDue(task)}</span>
                <span className="rounded-full bg-[#f7f0d8] px-3 py-2 font-bold text-[#725d42] transition group-hover:bg-[#82d5bb] group-hover:text-white">
                  {task.status === "needs_resubmit" ? "查看补充原因" : isChildCompleted(task) ? "查看结果" : "去打卡"}
                </span>
              </div>
            </Link>
          ))}
          {isLoading ? <p className="px-2 py-4 text-body-sm text-muted">正在加载...</p> : null}
          {!isLoading && visibleTasks.length === 0 ? (
            <p className="rounded-[22px] border-2 border-dashed border-[#eadfc3] bg-white/60 px-4 py-8 text-center text-body-sm text-muted">
              {activeMeta.empty}
            </p>
          ) : null}
        </div>
      </AppCard>
    </div>
  );
}

function isTodayIncomplete(task: StudyTask) {
  return !task.isOverdue && !isChildCompleted(task) && (!task.dueDate || task.dueDate === getBusinessDate());
}

function isOverdueIncomplete(task: StudyTask) {
  return Boolean(task.isOverdue);
}

function isChildCompleted(task: StudyTask) {
  return task.status === "parent_review" || task.status === "confirmed";
}

function isChildResultTask(task: StudyTask) {
  return isChildCompleted(task) || task.status === "needs_resubmit";
}

function formatDue(task: StudyTask) {
  if (!task.dueDate) {
    return task.dueTime ?? "今日";
  }

  return task.dueTime ? `${task.dueDate} ${task.dueTime}` : task.dueDate;
}
