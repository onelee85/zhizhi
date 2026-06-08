"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AppButton, AppButtonLink } from "@/components/ui/button";
import { AppCard, AppCardTitle } from "@/components/ui/card";
import { AppSelect } from "@/components/ui/select";
import { ApiError, getHistoryTasks } from "@/features/api/client";
import { getImageCount, statusLabel, statusTone } from "@/features/tasks/status";
import type { StudyTask, UserRole } from "@/features/tasks/types";

type ChildOption = {
  id: string;
  label: string;
};

export function TaskHistoryList({ role }: { role: UserRole }) {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [childFilter, setChildFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isParent = role === "parent";

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const result = await getHistoryTasks();
        if (active) {
          setTasks(result.tasks);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "加载历史任务失败");
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

  const childOptions = useMemo(() => getChildOptions(tasks), [tasks]);
  const filteredTasks = tasks.filter((task) => {
    const matchesChild = !isParent || childFilter === "all" || task.childUserId === childFilter;
    const matchesStartDate = !startDate || (task.dueDate ?? "") >= startDate;
    const matchesEndDate = !endDate || (task.dueDate ?? "") <= endDate;
    return matchesChild && matchesStartDate && matchesEndDate;
  });
  const totalReward = filteredTasks.reduce((sum, task) => sum + (task.rewardPoints ?? 0), 0);
  const imageCount = filteredTasks.reduce((sum, task) => sum + getImageCount(task), 0);
  const hasActiveFilter = (isParent && childFilter !== "all") || Boolean(startDate) || Boolean(endDate);

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div className="grid gap-5 rounded-[32px] bg-[#fffdf2] p-5 shadow-[0_10px_0_rgba(114,93,66,0.08)] md:grid-cols-[1fr_auto] md:items-end md:p-6">
        <div>
          <p className="text-caption-uppercase text-muted">Task archive</p>
          <h1 className="mt-3 text-display-sm tracking-normal text-ink">
            {isParent ? "家庭历史任务" : "我的历史任务"}
          </h1>
          <p className="mt-3 max-w-2xl text-body-sm text-body">
            家长确认完成超过 7 天的任务会进入这里，保留提交照片、审核状态和积分记录入口。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <AppButtonLink href={isParent ? "/parent/calendar" : "/child/calendar"} variant="secondary">
            日历面板
          </AppButtonLink>
          <AppButtonLink href={isParent ? "/parent" : "/child"}>返回任务清单</AppButtonLink>
        </div>
      </div>

      {error ? <AppCard className="text-body-sm text-brand-coral">{error}</AppCard> : null}

      <section className="grid grid-cols-3 gap-3">
        <AppCard variant="ochre" className="text-[#725d42]">
          <p className="text-caption text-[#725d42]/70">历史任务</p>
          <p className="mt-2 text-display-sm tracking-normal text-[#725d42]">{isLoading ? "-" : filteredTasks.length}</p>
        </AppCard>
        <AppCard variant="teal" className="text-white">
          <p className="text-caption text-white/75">累计积分</p>
          <p className="mt-2 text-display-sm tracking-normal text-white">{isLoading ? "-" : totalReward}</p>
        </AppCard>
        <AppCard variant="lavender" className="text-white">
          <p className="text-caption text-white/75">照片</p>
          <p className="mt-2 text-display-sm tracking-normal text-white">{isLoading ? "-" : imageCount}</p>
        </AppCard>
      </section>

      <AppCard className="overflow-visible p-0 md:p-0">
        <div className="grid gap-4 px-5 pt-5 md:grid-cols-[1fr_auto] md:items-start md:px-6 md:pt-6">
          <div>
            <AppCardTitle>归档列表</AppCardTitle>
            <p className="mt-2 text-body-sm text-muted">历史任务只读展示，不支持编辑、删除或重新提交。</p>
          </div>
          <div className="grid gap-3 md:min-w-[520px] md:grid-cols-[1fr_1fr_1fr_auto]">
            {isParent ? (
              <label className="text-caption text-muted">
                孩子
                <AppSelect
                  value={childFilter}
                  onChange={(key) => setChildFilter(key as string)}
                  options={[
                    { key: "all", label: "全部孩子" },
                    ...childOptions.map((child) => ({ key: child.id, label: child.label }))
                  ]}
                />
              </label>
            ) : null}
            <label className="text-caption text-muted">
              开始日期
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1"
              />
            </label>
            <label className="text-caption text-muted">
              结束日期
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1"
              />
            </label>
            <div className="flex items-end gap-2">
              <span className="inline-flex h-11 items-center rounded-pill bg-surface-card px-3 text-caption text-muted-soft">
                {filteredTasks.length}/{tasks.length} 项
              </span>
              {hasActiveFilter ? (
                <AppButton
                  type="button"
                  variant="ghost"
                  className="h-11 px-3 text-caption text-muted-soft"
                  onClick={() => {
                    setChildFilter("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  清空
                </AppButton>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 px-4 pb-4 md:px-5 md:pb-5">
          {filteredTasks.map((task) => (
            <Link
              key={task.id}
              href={getHistoryTaskHref(role, task)}
              className="grid gap-4 rounded-[24px] border-2 border-[#eadfc3] bg-[#fffdf8] p-4 transition hover:border-[#82d5bb] md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{task.subject}</Badge>
                  <Badge>{task.taskType}</Badge>
                  <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
                  <Badge tone="neutral">已归档</Badge>
                  {getImageCount(task) > 0 ? <Badge tone="lavender">{getImageCount(task)} 张图</Badge> : null}
                  {task.rewardPoints ? <Badge tone="success">+{task.rewardPoints} 积分</Badge> : null}
                </div>
                <h2 className="mt-3 text-title-md text-ink">{task.title}</h2>
                <p className="mt-1 line-clamp-2 max-w-3xl text-body-sm text-muted">{task.description}</p>
              </div>
              <div className="flex flex-col gap-2 text-body-sm text-muted-soft md:items-end md:justify-center">
                <span>任务日期 {formatDateText(task.dueDate)}</span>
                <span>归档时间 {formatDateText(task.archivedAt)}</span>
                {isParent && task.childUserId ? <span>{getChildLabel(task.childUserId)}</span> : null}
              </div>
            </Link>
          ))}
          {isLoading ? <p className="px-2 py-4 text-body-sm text-muted">正在加载...</p> : null}
          {!isLoading && tasks.length === 0 ? (
            <p className="rounded-[22px] border-2 border-dashed border-[#eadfc3] bg-[#fffdf8] px-4 py-8 text-center text-body-sm text-muted">
              还没有已归档的历史任务。
            </p>
          ) : null}
          {!isLoading && tasks.length > 0 && filteredTasks.length === 0 ? (
            <p className="rounded-[22px] border-2 border-dashed border-[#eadfc3] bg-[#fffdf8] px-4 py-8 text-center text-body-sm text-muted">
              没有符合筛选条件的历史任务。
            </p>
          ) : null}
        </div>
      </AppCard>
    </div>
  );
}

function getChildOptions(tasks: StudyTask[]): ChildOption[] {
  const ids = new Set<string>();

  for (const task of tasks) {
    if (task.childUserId) {
      ids.add(task.childUserId);
    }
  }

  return Array.from(ids).map((id) => ({
    id,
    label: getChildLabel(id)
  }));
}

function getChildLabel(childUserId: string) {
  return childUserId === "child-1" ? "孩子" : childUserId;
}

function getHistoryTaskHref(role: UserRole, task: StudyTask) {
  if (role === "parent") {
    return `/parent/tasks/${task.id}?from=history`;
  }

  return `/child/tasks/${task.id}/result?from=history`;
}

function formatDateText(value?: string | null) {
  if (!value) {
    return "暂无";
  }

  return value.slice(0, 10);
}
