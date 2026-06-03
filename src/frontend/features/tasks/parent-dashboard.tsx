"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AppButton, AppButtonLink } from "@/components/ui/button";
import { AppCard, AppCardTitle } from "@/components/ui/card";
import { AppConfirmModal } from "@/components/ui/modal";
import { AppSelect } from "@/components/ui/select";
import { ApiError, deleteTask, getParentDashboard } from "@/features/api/client";
import { getImageCount, statusLabel, statusTone } from "@/features/tasks/status";
import type { ParentDashboard, StudyTask, TaskStatus } from "@/features/tasks/types";

const statusFilterOptions: Array<{ value: "all" | TaskStatus; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: statusLabel.pending },
  { value: "submitted", label: statusLabel.submitted },
  { value: "ai_checking", label: statusLabel.ai_checking },
  { value: "parent_review", label: statusLabel.parent_review },
  { value: "confirmed", label: statusLabel.confirmed },
  { value: "needs_resubmit", label: statusLabel.needs_resubmit }
];

export function ParentDashboardView() {
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<StudyTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  function openDeleteModal(event: React.MouseEvent, task: StudyTask) {
    event.preventDefault();
    event.stopPropagation();
    setError("");
    setDeleteTarget(task);
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除任务失败");
    } finally {
      setIsDeleting(false);
    }
  }

  const total = dashboard?.summary.total ?? tasks.length;
  const done = dashboard?.summary.confirmed ?? tasks.filter((task) => task.status === "confirmed").length;
  const needsResubmit =
    dashboard?.summary.needsResubmit ?? tasks.filter((task) => task.status === "needs_resubmit").length;
  const waitingReview =
    dashboard?.summary.waitingReview ?? tasks.filter((task) => task.status === "parent_review").length;
  const filteredTasks = tasks.filter((task) => {
    const matchesDate = !dateFilter || task.dueDate === dateFilter;
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesDate && matchesStatus;
  });
  const hasActiveFilter = Boolean(dateFilter) || statusFilter !== "all";

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div className="grid gap-5 rounded-[32px] bg-[#fffdf2] p-5 shadow-[0_10px_0_rgba(114,93,66,0.08)] md:grid-cols-[1fr_auto] md:items-end md:p-6">
        <div>
          <p className="text-caption-uppercase text-muted">Parent dashboard</p>
          <h1 className="mt-3 text-display-sm tracking-normal text-ink">家长任务管理</h1>
          <p className="mt-3 max-w-2xl text-body-sm text-body">
            轻量查看家庭任务进度，快速定位待确认、需补充和已完成的任务。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <AppButtonLink href="/parent/calendar" variant="secondary">日历面板</AppButtonLink>
          <AppButtonLink href="/parent/wishes" variant="secondary">愿望管理</AppButtonLink>
          <AppButtonLink href="/parent/tasks/new">创建任务</AppButtonLink>
        </div>
      </div>

      {error ? <AppCard className="text-body-sm text-brand-coral">{error}</AppCard> : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AppCard variant="ochre" className="text-[#725d42]">
          <p className="text-caption text-[#725d42]/70">今日任务</p>
          <p className="mt-2 text-display-sm tracking-normal text-[#725d42]">{isLoading ? "-" : total}</p>
        </AppCard>
        <AppCard variant="teal" className="text-white">
          <p className="text-caption text-white/75">已确认</p>
          <p className="mt-2 text-display-sm tracking-normal text-white">{isLoading ? "-" : done}</p>
        </AppCard>
        <AppCard variant="lavender" className="text-white">
          <p className="text-caption text-white/75">待确认</p>
          <p className="mt-2 text-display-sm tracking-normal text-white">{isLoading ? "-" : waitingReview}</p>
        </AppCard>
        <AppCard variant="peach" className="text-white">
          <p className="text-caption text-white/75">需补充</p>
          <p className="mt-2 text-display-sm tracking-normal text-white">{isLoading ? "-" : needsResubmit}</p>
        </AppCard>
      </section>

      <AppCard className="overflow-visible p-0 md:p-0">
        <div className="mb-4 grid gap-4 px-5 pt-5 md:grid-cols-[1fr_auto] md:items-start md:px-6 md:pt-6">
          <div>
            <AppCardTitle>任务列表</AppCardTitle>
          </div>
          <div className="grid gap-3 md:min-w-[430px] md:grid-cols-[1fr_1fr_auto]">
            <label className="text-caption text-muted">
              日期
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="mt-1"
              />
            </label>
            <label className="text-caption text-muted">
              状态
              <AppSelect
                value={statusFilter}
                onChange={(key) => setStatusFilter(key as "all" | TaskStatus)}
                options={statusFilterOptions.map((option) => ({ key: option.value, label: option.label }))}
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
                    setDateFilter("");
                    setStatusFilter("all");
                  }}
                >
                  清空
                </AppButton>
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid gap-3 px-4 pb-4 md:px-5 md:pb-5">
          {filteredTasks.map((task) => (
            <Link
              key={task.id}
              href={`/parent/tasks/${task.id}`}
              className="grid gap-4 rounded-[24px] border-2 border-[#eadfc3] bg-[#fffdf8] p-4 transition hover:border-[#82d5bb] md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{task.subject}</Badge>
                  <Badge tone={statusTone[task.status]}>{statusLabel[task.status]}</Badge>
                  {getImageCount(task) > 0 ? <Badge tone="lavender">{getImageCount(task)} 张图</Badge> : null}
                  {task.rewardPoints ? <Badge tone="success">+{task.rewardPoints} 积分</Badge> : null}
                </div>
                <h2 className="mt-3 text-title-md text-ink">{task.title}</h2>
                <p className="mt-1 max-w-3xl text-body-sm text-muted">{task.description}</p>
              </div>
              <div className="flex items-center gap-3 md:justify-end">
                <span className="text-body-sm text-muted-soft">
                  截止 {task.dueTime ? task.dueTime : task.dueDate ?? "今日"}
                </span>
                {task.status === "pending" || task.status === "needs_resubmit" ? (
                  <AppButton
                    variant="ghost"
                    className="text-caption text-muted-soft hover:text-brand-coral"
                    onClick={(event) => openDeleteModal(event, task)}
                  >
                    删除
                  </AppButton>
                ) : null}
              </div>
            </Link>
          ))}
          {!isLoading && tasks.length === 0 ? (
            <p className="rounded-[22px] border-2 border-dashed border-[#eadfc3] bg-[#fffdf8] px-4 py-8 text-center text-body-sm text-muted">
              还没有创建任务。
            </p>
          ) : null}
          {!isLoading && tasks.length > 0 && filteredTasks.length === 0 ? (
            <p className="rounded-[22px] border-2 border-dashed border-[#eadfc3] bg-[#fffdf8] px-4 py-8 text-center text-body-sm text-muted">
              没有符合筛选条件的任务。
            </p>
          ) : null}
        </div>
      </AppCard>
      <AppConfirmModal
        open={Boolean(deleteTarget)}
        title="删除任务"
        description="确定要删除这个任务吗？删除后孩子端将不再看到它。"
        detail={deleteTarget ? `任务：${deleteTarget.title}` : undefined}
        confirmText="删除"
        loading={isDeleting}
        tone="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
